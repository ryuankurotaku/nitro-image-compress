import type { HybridObject } from 'react-native-nitro-modules';

/**
 * Supported output image formats for compression.
 *
 * - `jpeg` — Best for photos. Lossy compression, smallest file sizes at acceptable quality.
 * - `png` — Best for graphics/screenshots. Lossless, larger file sizes. Quality param is ignored.
 * - `webp` — Modern format with superior compression. Requires iOS 14+ / Android API 18+.
 */
export type ImageFormat = 'jpeg' | 'png' | 'webp';

/**
 * Configuration options for image compression.
 *
 * All options are optional — sensible defaults are applied:
 * - quality: 0.7 (70%)
 * - format: 'jpeg'
 * - No resize (original dimensions preserved)
 * - Returns file URI (not base64)
 */
export interface CompressOptions {
  /**
   * Output quality from 0.0 (maximum compression) to 1.0 (maximum quality).
   * Only applies to lossy formats (jpeg, webp). PNG ignores this value.
   *
   * @default 0.7
   * @example 0.5 — aggressive compression, visible artifacts
   * @example 0.8 — balanced quality/size tradeoff
   * @example 1.0 — minimal compression, near-original quality
   */
  quality?: number;

  /**
   * Maximum output width in pixels.
   * The image will be scaled down maintaining aspect ratio if it exceeds this width.
   * Set to 0 or omit to preserve original width.
   *
   * @example 1920 — Full HD width cap
   * @example 800 — Thumbnail/preview size
   */
  maxWidth?: number;

  /**
   * Maximum output height in pixels.
   * The image will be scaled down maintaining aspect ratio if it exceeds this height.
   * Both maxWidth and maxHeight can be set — the stricter constraint wins.
   * Set to 0 or omit to preserve original height.
   */
  maxHeight?: number;

  /**
   * Output image format.
   * @default 'jpeg'
   */
  format?: ImageFormat;

  /**
   * If true, returns a base64 data URI string instead of a file path.
   * Useful for direct upload to APIs that accept base64.
   *
   * ⚠️ Warning: Base64 encoding increases memory usage by ~33%.
   * Only use for small images or when file URI isn't practical.
   *
   * @default false
   */
  returnBase64?: boolean;
}

/**
 * Result returned after successful image compression.
 */
export interface CompressResult {
  /**
   * Output location of the compressed image.
   * - File URI (e.g., `file:///tmp/compressed_xxx.jpeg`) when `returnBase64` is false
   * - Base64 data URI (e.g., `data:image/jpeg;base64,...`) when `returnBase64` is true
   */
  uri: string;

  /** Width of the output image in pixels (after resize if applicable) */
  width: number;

  /** Height of the output image in pixels (after resize if applicable) */
  height: number;

  /** Output file size in bytes. Compare with source size to calculate savings. */
  size: number;
}

/**
 * Metadata about an image, retrieved without performing compression.
 * Returned synchronously via JSI — no async overhead.
 */
export interface ImageInfo {
  /** Width in pixels (accounts for EXIF orientation on iOS) */
  width: number;

  /** Height in pixels (accounts for EXIF orientation on iOS) */
  height: number;

  /** File size in bytes on disk */
  size: number;

  /**
   * Detected MIME type based on file magic bytes.
   * @example "image/jpeg", "image/png", "image/webp"
   */
  mimeType: string;
}

/**
 * The Nitro HybridObject interface for the native image compressor.
 *
 * This interface is implemented natively in:
 * - **iOS**: `HybridImageCompressor.swift` (UIImage + ImageIO)
 * - **Android**: `HybridImageCompressor.kt` (id.zelory:compressor)
 */
export interface ImageCompressor
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Compress an image at the given URI.
   * Runs on a native background thread — does not block the JS thread.
   */
  compress(uri: string, options: CompressOptions): Promise<CompressResult>;

  /**
   * Get metadata about an image without compressing it.
   * Executes synchronously via JSI — returns instantly (~0.3ms).
   */
  getImageInfo(uri: string): ImageInfo;
}
