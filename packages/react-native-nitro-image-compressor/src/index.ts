/**
 * @module react-native-nitro-image-compressor
 *
 * High-performance on-device image compression for React Native.
 * Uses Nitro Modules (JSI) for synchronous and near-native performance.
 *
 * @example
 * ```ts
 * import { compress, getImageInfo } from 'react-native-nitro-image-compressor';
 *
 * // Sync metadata lookup (~0.3ms)
 * const info = getImageInfo('file:///photo.jpg');
 *
 * // Async compression on native thread
 * const result = await compress('file:///photo.jpg', {
 *   quality: 0.7,
 *   maxWidth: 1920,
 * });
 * ```
 */
export { compress, getImageInfo } from './compress';
export { HybridImageCompressor } from './nitro';
export type { ImageCompressor as ImageCompressorNative } from './specs/ImageCompressor.nitro';
export type * from './types';
