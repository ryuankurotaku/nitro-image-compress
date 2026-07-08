/**
 * Benchmark result for a single library compression run.
 * Used to compare performance across different compression libraries.
 */
export interface BenchmarkResult {
  /** Name of the library that produced this result */
  library: string;
  /** Wall-clock time in milliseconds for the compression operation */
  duration: number;
  /** Output file size in bytes */
  outputSize: number;
  /** Output image width in pixels */
  outputWidth: number;
  /** Output image height in pixels */
  outputHeight: number;
  /** File URI of the compressed output (for preview display) */
  outputUri: string;
  /** Error message if compression failed (undefined on success) */
  error?: string;
}

/**
 * Metadata about the source image selected for benchmarking.
 * Populated using react-native-nitro-image-compressor's synchronous `getImageInfo()`.
 */
export interface ImageSource {
  /** Local file URI of the selected image */
  uri: string;
  /** Original file name from the image picker */
  fileName: string;
  /** File size in bytes (before compression) */
  fileSize: number;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
}
