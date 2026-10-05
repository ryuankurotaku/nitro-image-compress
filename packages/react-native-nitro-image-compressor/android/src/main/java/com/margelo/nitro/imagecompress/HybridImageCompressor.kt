package com.margelo.nitro.imagecompress

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.webkit.MimeTypeMap
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.HybridObject
import com.margelo.nitro.core.Promise
import id.zelory.compressor.Compressor
import id.zelory.compressor.constraint.format
import id.zelory.compressor.constraint.quality
import id.zelory.compressor.constraint.resolution
import java.io.File
import java.util.UUID
import kotlin.math.roundToInt

/**
 * Native Android implementation of the ImageCompressor Nitro HybridObject.
 *
 * Uses [id.zelory:compressor](https://github.com/zetbaitsu/Compressor) for image compression,
 * which provides:
 * - Smart `inSampleSize` calculation for memory-efficient decoding
 * - Automatic EXIF orientation correction
 * - Aspect-ratio-aware resizing
 *
 * Compression runs on a coroutine/thread via Nitro's `Promise.async`.
 * The `getImageInfo` method is synchronous (called directly via JSI).
 *
 * @param context Android application context, needed by Compressor for cache directory access
 */
class HybridImageCompressor(
    private val context: Context,
) : HybridImageCompressorSpec() {

    constructor() : this(
        NitroModules.applicationContext
            ?: throw IllegalStateException("NitroModules.applicationContext is null")
    )

    override val memorySize: Long
        get() = 0L

    // MARK: - getImageInfo (synchronous via JSI)

    /**
     * Reads image dimensions and file size without fully decoding the bitmap.
     * Uses `BitmapFactory.Options.inJustDecodeBounds = true` for zero-allocation metadata read.
     *
     * @param uri File URI or absolute path to the image
     * @return [ImageInfo] with pixel dimensions, byte size, and MIME type
     */
    override fun getImageInfo(uri: String): ImageInfo {
        val file = resolveFile(uri)
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.absolutePath, options)

        val mimeType = options.outMimeType ?: detectMimeType(file)

        return ImageInfo(
            width = options.outWidth.toDouble(),
            height = options.outHeight.toDouble(),
            size = file.length().toDouble(),
            mimeType = mimeType
        )
    }

    // MARK: - compress (async, powered by Compressor lib)

    /**
     * Compresses an image using the Compressor library.
     *
     * Pipeline:
     * 1. Copy source file to cache (Compressor requires a writable file)
     * 2. Apply resolution constraints (maintains aspect ratio)
     * 3. Compress with specified quality and format
     * 4. Return file URI or base64 data URI
     *
     * @param uri File URI or absolute path to the source image
     * @param options Compression configuration
     * @return Promise resolving to [CompressResult]
     */
    override fun compress(uri: String, options: CompressOptions): Promise<CompressResult> {
        return Promise.async {
            val sourceFile = resolveFile(uri)
            val quality = ((options.quality ?: 0.7) * 100).roundToInt()
            val format = options.format ?: ImageFormat.JPEG
            val maxWidth = (options.maxWidth ?: 0.0).roundToInt()
            val maxHeight = (options.maxHeight ?: 0.0).roundToInt()

            val compressFormat = when (format) {
                ImageFormat.JPEG -> Bitmap.CompressFormat.JPEG
                ImageFormat.PNG -> Bitmap.CompressFormat.PNG
                ImageFormat.WEBP -> Bitmap.CompressFormat.WEBP_LOSSY
            }

            // Compressor modifies the input file, so we work on a copy
            val workingFile = File(getCacheDir(), "source_${UUID.randomUUID()}.tmp")
            sourceFile.copyTo(workingFile, overwrite = true)

            // Apply compression constraints via Compressor DSL
            val compressedFile = Compressor.compress(context, workingFile) {
                if (maxWidth > 0 && maxHeight > 0) {
                    resolution(maxWidth, maxHeight)
                } else if (maxWidth > 0) {
                    // Only width constrained — use very large height to avoid height-limiting
                    resolution(maxWidth, maxWidth * 10)
                } else if (maxHeight > 0) {
                    // Only height constrained — use very large width to avoid width-limiting
                    resolution(maxHeight * 10, maxHeight)
                }
                quality(quality)
                format(compressFormat)
            }

            // Clean up the temporary working copy
            workingFile.delete()

            // Read output dimensions (zero-allocation bounds-only decode)
            val outputOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeFile(compressedFile.absolutePath, outputOptions)

            // Build the output URI (either file path or base64 data URI)
            val outputUri: String
            val outputSize: Double
            if (options.returnBase64 == true) {
                val bytes = compressedFile.readBytes()
                val base64 = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
                outputSize = bytes.size.toDouble()
                compressedFile.delete()
                outputUri = "data:image/${format.name.lowercase()};base64,$base64"
            } else {
                // Rename to final output path with correct extension
                val ext = format.name.lowercase()
                val outputFile = File(getCacheDir(), "compressed_${UUID.randomUUID()}.$ext")
                compressedFile.renameTo(outputFile)
                outputSize = outputFile.length().toDouble()
                outputUri = Uri.fromFile(outputFile).toString()
            }

            CompressResult(
                uri = outputUri,
                width = outputOptions.outWidth.toDouble(),
                height = outputOptions.outHeight.toDouble(),
                size = outputSize
            )
        }
    }

    // MARK: - Private Helpers

    /**
     * Resolves a file URI, content URI, or absolute path string to a [File] instance.
     * Strips `file://` or `file:` prefixes if present, or copies `content://` streams to cache.
     */
    private fun resolveFile(uri: String): File {
        if (uri.startsWith("content://")) {
            val contentUri = Uri.parse(uri)
            val tempFile = File(context.cacheDir, "input_${UUID.randomUUID()}")
            context.contentResolver.openInputStream(contentUri)?.use { input ->
                tempFile.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
            return tempFile
        }
        val cleaned = uri
            .removePrefix("file://")
            .removePrefix("file:")
        return File(cleaned)
    }

    /**
     * Detects MIME type from file extension using Android's [MimeTypeMap].
     * Fallback when BitmapFactory doesn't report outMimeType (rare edge case).
     */
    private fun detectMimeType(file: File): String {
        val extension = file.extension.lowercase()
        return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
            ?: "application/octet-stream"
    }

    /**
     * Returns (and creates if needed) the app-scoped cache directory for compressed outputs.
     * Located at: `<app-cache>/nitro-image-compress/`
     */
    private fun getCacheDir(): File {
        val dir = File(context.cacheDir, "nitro-image-compress")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    companion object {
        init {
            try {
                System.loadLibrary("NitroImageCompress")
            } catch (_: Throwable) {
                // Ignored if already loaded
            }
        }
    }
}
