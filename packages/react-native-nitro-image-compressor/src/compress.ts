import { NitroModules } from 'react-native-nitro-modules';
import type {
  ImageCompressor,
  CompressOptions,
  CompressResult,
  ImageInfo,
} from './types';

/**
 * Lazily-initialized singleton instance of the native ImageCompressor.
 * Created via Nitro's HybridObject registry on first access.
 * The native side (Swift/Kotlin) handles the actual compression work.
 */
let _imageCompressor: ImageCompressor | undefined;
function getImageCompressor(): ImageCompressor {
  if (!_imageCompressor) {
    _imageCompressor =
      NitroModules.createHybridObject<ImageCompressor>('ImageCompressor');
  }
  return _imageCompressor;
}

/**
 * Compress an image at the given file URI.
 *
 * Runs compression on a native background thread — does NOT block the JS thread.
 * The output is written to the device's temp directory (auto-cleaned by the OS).
 *
 * @param uri - Local file URI of the source image (e.g., `file:///path/to/photo.jpg`)
 * @param options - Compression options. All optional with sensible defaults.
 * @returns Promise resolving to the compressed image result with URI, dimensions, and byte size.
 * @throws If the image cannot be decoded (corrupt file, unsupported format, invalid URI).
 *
 * @example Basic compression
 * ```ts
 * const result = await compress('file:///path/to/photo.jpg', {
 *   quality: 0.7,
 *   maxWidth: 1920,
 *   format: 'jpeg',
 * });
 * console.log(`Compressed: ${result.size} bytes at ${result.width}x${result.height}`);
 * ```
 *
 * @example Get base64 for direct upload
 * ```ts
 * const result = await compress(uri, { quality: 0.6, returnBase64: true });
 * await fetch('/upload', { body: result.uri }); // data:image/jpeg;base64,...
 * ```
 */
export const compress = (
  uri: string,
  options: CompressOptions = {},
): Promise<CompressResult> => {
  return getImageCompressor().compress(uri, {
    quality: options.quality ?? 0.7,
    maxWidth: options.maxWidth ?? 0,
    maxHeight: options.maxHeight ?? 0,
    format: options.format ?? 'jpeg',
    returnBase64: options.returnBase64 ?? false,
  });
};

/**
 * Get image metadata without performing any compression.
 *
 * This is a **synchronous** call via JSI — no bridge round-trip, no async overhead.
 * Typically completes in ~0.3ms. Safe to call in render paths or event handlers.
 *
 * @param uri - Local file URI of the image
 * @returns Image metadata including dimensions, byte size, and detected MIME type.
 * @throws If the file cannot be read or its header cannot be parsed.
 *
 * @example
 * ```ts
 * const info = getImageInfo('file:///path/to/photo.jpg');
 * console.log(`${info.width}x${info.height}, ${info.size} bytes, ${info.mimeType}`);
 * ```
 */
export const getImageInfo = (uri: string): ImageInfo => {
  return getImageCompressor().getImageInfo(uri);
};
