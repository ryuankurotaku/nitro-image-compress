package com.nitro.imagecompress

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.webkit.MimeTypeMap
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
 * Uses id.zelory:compressor for efficient image compression.
 */
class HybridImageCompressor(
    private val context: Context,
) : HybridImageCompressorSpec() {

    override val memorySize: Long
        get() = 0L

    // MARK: - getImageInfo (synchronous via JSI)

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

            // Copy source to cache so Compressor can work with it
            val workingFile = File(getCacheDir(), "source_${UUID.randomUUID()}.tmp")
            sourceFile.copyTo(workingFile, overwrite = true)

            // Use Compressor library for compression
            val compressedFile = Compressor.compress(context, workingFile) {
                if (maxWidth > 0 && maxHeight > 0) {
                    resolution(maxWidth, maxHeight)
                } else if (maxWidth > 0) {
                    resolution(maxWidth, maxWidth * 10)
                } else if (maxHeight > 0) {
                    resolution(maxHeight * 10, maxHeight)
                }
                quality(quality)
                format(compressFormat)
            }

            // Clean up working file
            workingFile.delete()

            // Read output dimensions
            val outputOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeFile(compressedFile.absolutePath, outputOptions)

            // Build result
            val outputUri: String = if (options.returnBase64 == true) {
                val bytes = compressedFile.readBytes()
                val base64 = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
                compressedFile.delete()
                "data:image/${format.name.lowercase()};base64,$base64"
            } else {
                // Move to a predictable output path
                val ext = format.name.lowercase()
                val outputFile = File(getCacheDir(), "compressed_${UUID.randomUUID()}.$ext")
                compressedFile.renameTo(outputFile)
                Uri.fromFile(outputFile).toString()
            }

            CompressResult(
                uri = outputUri,
                width = outputOptions.outWidth.toDouble(),
                height = outputOptions.outHeight.toDouble(),
                size = compressedFile.length().toDouble()
            )
        }
    }

    // MARK: - Private Helpers

    private fun resolveFile(uri: String): File {
        val cleaned = uri
            .removePrefix("file://")
            .removePrefix("file:")
        return File(cleaned)
    }

    private fun detectMimeType(file: File): String {
        val extension = file.extension.lowercase()
        return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
            ?: "application/octet-stream"
    }

    private fun getCacheDir(): File {
        val dir = File(context.cacheDir, "nitro-image-compress")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }
}
