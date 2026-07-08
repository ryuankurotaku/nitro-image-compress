import type { HybridObject } from 'react-native-nitro-modules';

/**
 * Supported output image formats.
 */
export type ImageFormat = 'jpeg' | 'png' | 'webp';

/**
 * Options for image compression.
 */
export interface CompressOptions {
  /**
   * Output quality (0.0 - 1.0). Default: 0.7
   * Only applies to lossy formats (jpeg, webp).
   */
  quality?: number;

  /**
   * Maximum output width in pixels. Maintains aspect ratio.
   * If not provided, original width is preserved.
   */
  maxWidth?: number;

  /**
   * Maximum output height in pixels. Maintains aspect ratio.
   * If not provided, original height is preserved.
   */
  maxHeight?: number;

  /**
   * Output format. Default: 'jpeg'
   */
  format?: ImageFormat;

  /**
   * If true, returns base64 string instead of file URI.
   * Default: false
   */
  returnBase64?: boolean;
}

/**
 * Result of image compression.
 */
export interface CompressResult {
  /** File URI of the compressed image (or base64 string if returnBase64 is true) */
  uri: string;
  /** Width of the output image */
  width: number;
  /** Height of the output image */
  height: number;
  /** File size in bytes */
  size: number;
}

/**
 * Basic image metadata.
 */
export interface ImageInfo {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** File size in bytes */
  size: number;
  /** MIME type (e.g., "image/jpeg") */
  mimeType: string;
}

/**
 * The Nitro HybridObject spec for image compression.
 */
export interface ImageCompressor
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Compress an image at the given URI.
   */
  compress(uri: string, options: CompressOptions): Promise<CompressResult>;

  /**
   * Get metadata about an image without compressing it.
   */
  getImageInfo(uri: string): ImageInfo;
}
