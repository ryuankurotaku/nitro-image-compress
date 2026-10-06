package com.margelo.nitro.imagecompress

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import android.os.Build
import android.util.Base64
import android.webkit.MimeTypeMap
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import java.io.BufferedOutputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.UUID
import kotlin.math.roundToInt

/**
 * High-performance native Android implementation of the ImageCompressor Nitro HybridObject.
 *
 * Pipeline features:
 * - Zero-allocation bounds and EXIF orientation detection
 * - Aspect-ratio aware bounding box containment
 * - Fast subsampled decoding (`inSampleSize`) to avoid huge RAM allocations
 * - Hardware-filtered scaling via `Bitmap.createScaledBitmap`
 * - Direct single-pass stream compression into final output file (zero intermediate disk copies)
 * - Immediate native bitmap recycling to minimize GC pressure
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

    override fun getImageInfo(uri: String): ImageInfo {
        val rotation = getRotationDegrees(uri)
        val isRotated90or270 = rotation == 90 || rotation == 270

        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }

        val fileSize: Double
        val mimeType: String

        if (uri.startsWith("content://")) {
            val contentUri = Uri.parse(uri)
            context.contentResolver.openInputStream(contentUri)?.use { input ->
                BitmapFactory.decodeStream(input, null, options)
            }
            fileSize = context.contentResolver.openAssetFileDescriptor(contentUri, "r")?.use {
                it.length.toDouble()
            } ?: 0.0
            mimeType = options.outMimeType ?: context.contentResolver.getType(contentUri) ?: "image/jpeg"
        } else {
            val file = resolveFile(uri)
            BitmapFactory.decodeFile(file.absolutePath, options)
            fileSize = file.length().toDouble()
            mimeType = options.outMimeType ?: detectMimeType(file)
        }

        val visualWidth = if (isRotated90or270) options.outHeight else options.outWidth
        val visualHeight = if (isRotated90or270) options.outWidth else options.outHeight

        return ImageInfo(
            width = visualWidth.toDouble(),
            height = visualHeight.toDouble(),
            size = fileSize,
            mimeType = mimeType
        )
    }

    // MARK: - compress (async on background thread via Nitro Promise)

    override fun compress(uri: String, options: CompressOptions): Promise<CompressResult> {
        return Promise.async {
            val rotation = getRotationDegrees(uri)
            val isRotated90or270 = rotation == 90 || rotation == 270

            // Step 1: Decode bounds with zero allocation
            val boundsOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            if (uri.startsWith("content://")) {
                val contentUri = Uri.parse(uri)
                context.contentResolver.openInputStream(contentUri)?.use {
                    BitmapFactory.decodeStream(it, null, boundsOptions)
                }
            } else {
                val file = resolveFile(uri)
                BitmapFactory.decodeFile(file.absolutePath, boundsOptions)
            }

            val rawWidth = boundsOptions.outWidth
            val rawHeight = boundsOptions.outHeight
            if (rawWidth <= 0 || rawHeight <= 0) {
                throw IOException("Failed to decode image bounds at $uri")
            }

            // Visual dimensions taking EXIF rotation into account
            val visualWidth = if (isRotated90or270) rawHeight else rawWidth
            val visualHeight = if (isRotated90or270) rawWidth else rawHeight

            val maxWidth = (options.maxWidth ?: 0.0).roundToInt()
            val maxHeight = (options.maxHeight ?: 0.0).roundToInt()

            // Step 2: Calculate target dimensions preserving aspect ratio
            var targetWidth = visualWidth
            var targetHeight = visualHeight

            if (maxWidth > 0 && maxHeight > 0) {
                val scale = minOf(maxWidth.toFloat() / visualWidth, maxHeight.toFloat() / visualHeight, 1.0f)
                targetWidth = (visualWidth * scale).roundToInt()
                targetHeight = (visualHeight * scale).roundToInt()
            } else if (maxWidth > 0 && visualWidth > maxWidth) {
                val scale = maxWidth.toFloat() / visualWidth
                targetWidth = maxWidth
                targetHeight = (visualHeight * scale).roundToInt()
            } else if (maxHeight > 0 && visualHeight > maxHeight) {
                val scale = maxHeight.toFloat() / visualHeight
                targetHeight = maxHeight
                targetWidth = (visualWidth * scale).roundToInt()
            }

            // Required dimensions in raw sensor orientation
            val reqRawWidth = if (isRotated90or270) targetHeight else targetWidth
            val reqRawHeight = if (isRotated90or270) targetWidth else targetHeight

            // Step 3: Compute optimal inSampleSize to avoid loading full-res bitmap into RAM
            var inSampleSize = 1
            if (rawHeight > reqRawHeight || rawWidth > reqRawWidth) {
                val halfHeight = rawHeight / 2
                val halfWidth = rawWidth / 2
                while ((halfHeight / inSampleSize) >= reqRawHeight && (halfWidth / inSampleSize) >= reqRawWidth) {
                    inSampleSize *= 2
                }
            }

            // Step 4: Decode sampled bitmap
            val decodeOptions = BitmapFactory.Options().apply {
                this.inSampleSize = inSampleSize
                this.inPreferredConfig = Bitmap.Config.ARGB_8888
            }

            val decodedBitmap: Bitmap = if (uri.startsWith("content://")) {
                val contentUri = Uri.parse(uri)
                context.contentResolver.openInputStream(contentUri)?.use {
                    BitmapFactory.decodeStream(it, null, decodeOptions)
                } ?: throw IOException("Cannot open input stream for $uri")
            } else {
                val file = resolveFile(uri)
                BitmapFactory.decodeFile(file.absolutePath, decodeOptions)
                    ?: throw IOException("Failed to decode bitmap from ${file.absolutePath}")
            }

            // Step 5: Rotate & scale to final target dimensions
            var processedBitmap = decodedBitmap

            if (rotation != 0) {
                val matrix = Matrix().apply { postRotate(rotation.toFloat()) }
                val rotated = Bitmap.createBitmap(
                    processedBitmap,
                    0,
                    0,
                    processedBitmap.width,
                    processedBitmap.height,
                    matrix,
                    true
                )
                if (rotated != processedBitmap) {
                    processedBitmap.recycle()
                    processedBitmap = rotated
                }
            }

            if (processedBitmap.width != targetWidth || processedBitmap.height != targetHeight) {
                val scaled = Bitmap.createScaledBitmap(processedBitmap, targetWidth, targetHeight, true)
                if (scaled != processedBitmap) {
                    processedBitmap.recycle()
                    processedBitmap = scaled
                }
            }

            // Step 6: Setup format & quality
            val format = options.format ?: ImageFormat.JPEG
            val quality = (((options.quality ?: 0.7) * 100).roundToInt()).coerceIn(0, 100)

            val compressFormat = when (format) {
                ImageFormat.JPEG -> Bitmap.CompressFormat.JPEG
                ImageFormat.PNG -> Bitmap.CompressFormat.PNG
                ImageFormat.WEBP -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        Bitmap.CompressFormat.WEBP_LOSSY
                    } else {
                        @Suppress("DEPRECATION")
                        Bitmap.CompressFormat.WEBP
                    }
                }
            }

            // Step 7: Stream directly into destination (zero intermediate temp copies)
            val outputUri: String
            val outputSize: Double
            val finalWidth = processedBitmap.width.toDouble()
            val finalHeight = processedBitmap.height.toDouble()

            if (options.returnBase64 == true) {
                val baos = ByteArrayOutputStream()
                processedBitmap.compress(compressFormat, quality, baos)
                processedBitmap.recycle()

                val bytes = baos.toByteArray()
                outputSize = bytes.size.toDouble()
                val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                val ext = when (format) {
                    ImageFormat.JPEG -> "jpeg"
                    ImageFormat.PNG -> "png"
                    ImageFormat.WEBP -> "webp"
                }
                outputUri = "data:image/$ext;base64,$base64"
            } else {
                val ext = when (format) {
                    ImageFormat.JPEG -> "jpg"
                    ImageFormat.PNG -> "png"
                    ImageFormat.WEBP -> "webp"
                }
                val outputFile = File(getCacheDir(), "compressed_${UUID.randomUUID()}.$ext")
                FileOutputStream(outputFile).use { fos ->
                    BufferedOutputStream(fos).use { bos ->
                        processedBitmap.compress(compressFormat, quality, bos)
                    }
                }
                processedBitmap.recycle()

                outputSize = outputFile.length().toDouble()
                outputUri = Uri.fromFile(outputFile).toString()
            }

            CompressResult(
                uri = outputUri,
                width = finalWidth,
                height = finalHeight,
                size = outputSize
            )
        }
    }

    // MARK: - Private Helpers

    /**
     * Resolves orientation degrees (0, 90, 180, 270) from EXIF metadata.
     */
    private fun getRotationDegrees(uri: String): Int {
        return try {
            val exif = if (uri.startsWith("content://")) {
                context.contentResolver.openInputStream(Uri.parse(uri))?.use {
                    ExifInterface(it)
                }
            } else {
                val cleaned = uri.removePrefix("file://").removePrefix("file:")
                ExifInterface(cleaned)
            } ?: return 0

            when (exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90
                ExifInterface.ORIENTATION_ROTATE_180 -> 180
                ExifInterface.ORIENTATION_ROTATE_270 -> 270
                else -> 0
            }
        } catch (_: Exception) {
            0
        }
    }

    /**
     * Resolves a file URI or path string to a [File] instance.
     */
    private fun resolveFile(uri: String): File {
        val cleaned = uri.removePrefix("file://").removePrefix("file:")
        return File(cleaned)
    }

    /**
     * Detects MIME type from file extension using Android's [MimeTypeMap].
     */
    private fun detectMimeType(file: File): String {
        val extension = file.extension.lowercase()
        return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
            ?: "application/octet-stream"
    }

    /**
     * Returns (and creates if needed) the app-scoped cache directory for compressed outputs.
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
