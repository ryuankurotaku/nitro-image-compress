import { NitroModules } from 'react-native-nitro-modules';
import type {
  ImageCompressor,
  CompressOptions,
  CompressResult,
  ImageInfo,
} from './types.js';

const imageCompressor =
  NitroModules.createHybridObject<ImageCompressor>('ImageCompressor');

/**
 * Compress an image at the given file URI.
 *
 * @param uri - Local file URI of the source image
 * @param options - Compression options (quality, size, format)
 * @returns Promise resolving to the compressed image result
 *
 * @example
 * ```ts
 * const result = await compress('file:///path/to/photo.jpg', {
 *   quality: 0.7,
 *   maxWidth: 1920,
 *   format: 'jpeg',
 * });
 * console.log(result.uri, result.size);
 * ```
 */
export const compress = (
  uri: string,
  options: CompressOptions = {},
): Promise<CompressResult> => {
  return imageCompressor.compress(uri, {
    quality: options.quality ?? 0.7,
    maxWidth: options.maxWidth ?? 0,
    maxHeight: options.maxHeight ?? 0,
    format: options.format ?? 'jpeg',
    returnBase64: options.returnBase64 ?? false,
  });
};

/**
 * Get image metadata without performing compression.
 * This is a synchronous call via JSI — no bridge overhead.
 *
 * @param uri - Local file URI of the image
 * @returns Image info (width, height, size, mimeType)
 *
 * @example
 * ```ts
 * const info = getImageInfo('file:///path/to/photo.jpg');
 * console.log(`${info.width}x${info.height}, ${info.size} bytes`);
 * ```
 */
export const getImageInfo = (uri: string): ImageInfo => {
  return imageCompressor.getImageInfo(uri);
};
