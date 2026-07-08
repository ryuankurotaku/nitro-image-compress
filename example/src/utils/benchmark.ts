import { compress as nitroCompress, getImageInfo } from 'nitro-image-compress';
import ImageResizer from 'react-native-image-resizer';
import { Image as RNCompressor } from 'react-native-compressor';
import type { BenchmarkResult, ImageSource } from './types.js';

/**
 * Standard compression parameters used across all benchmarks.
 * Ensures a fair apples-to-apples comparison between libraries.
 */
const QUALITY = 0.7;       // 70% JPEG quality
const MAX_WIDTH = 1920;    // Full HD width cap
const MAX_HEIGHT = 1080;   // Full HD height cap

/**
 * Runs a compression benchmark across all three libraries sequentially.
 *
 * Each library compresses the same source image with identical parameters.
 * Results include wall-clock timing via `performance.now()`.
 *
 * Libraries tested:
 * 1. **nitro-image-compress** — JSI/Nitro (this library)
 * 2. **react-native-image-resizer** — Old bridge architecture
 * 3. **react-native-compressor** — Native bridge
 *
 * @param source - The source image to compress (from image picker)
 * @returns Array of benchmark results, one per library
 */
export const runBenchmark = async (
  source: ImageSource,
): Promise<BenchmarkResult[]> => {
  const results: BenchmarkResult[] = [];

  // Run sequentially to avoid CPU contention affecting timing
  results.push(await benchmarkNitro(source.uri));
  results.push(await benchmarkImageResizer(source.uri));
  results.push(await benchmarkRNCompressor(source.uri));

  return results;
};

/**
 * Benchmarks nitro-image-compress (this library).
 * Uses JSI for near-zero overhead function calls.
 */
const benchmarkNitro = async (uri: string): Promise<BenchmarkResult> => {
  try {
    const start = performance.now();
    const result = await nitroCompress(uri, {
      quality: QUALITY,
      maxWidth: MAX_WIDTH,
      maxHeight: MAX_HEIGHT,
      format: 'jpeg',
    });
    const duration = performance.now() - start;

    return {
      library: 'nitro-image-compress',
      duration: Math.round(duration),
      outputSize: result.size,
      outputWidth: result.width,
      outputHeight: result.height,
      outputUri: result.uri,
    };
  } catch (error) {
    return {
      library: 'nitro-image-compress',
      duration: 0,
      outputSize: 0,
      outputWidth: 0,
      outputHeight: 0,
      outputUri: '',
      error: String(error),
    };
  }
};

/**
 * Benchmarks react-native-image-resizer.
 * Uses the old React Native bridge (JSON serialization overhead).
 */
const benchmarkImageResizer = async (uri: string): Promise<BenchmarkResult> => {
  try {
    const start = performance.now();
    const result = await ImageResizer.createResizedImage(
      uri,
      MAX_WIDTH,
      MAX_HEIGHT,
      'JPEG',
      Math.round(QUALITY * 100), // This lib expects 0-100 integer
      0,         // rotation
      undefined, // output path (use default temp)
      false,     // keep metadata
    );
    const duration = performance.now() - start;

    return {
      library: 'react-native-image-resizer',
      duration: Math.round(duration),
      outputSize: result.size,
      outputWidth: result.width,
      outputHeight: result.height,
      outputUri: result.uri,
    };
  } catch (error) {
    return {
      library: 'react-native-image-resizer',
      duration: 0,
      outputSize: 0,
      outputWidth: 0,
      outputHeight: 0,
      outputUri: '',
      error: String(error),
    };
  }
};

/**
 * Benchmarks react-native-compressor.
 * Uses native bridge with manual compression mode.
 * Output metadata is read via nitro's sync `getImageInfo` since this lib
 * doesn't return dimensions in its response.
 */
const benchmarkRNCompressor = async (uri: string): Promise<BenchmarkResult> => {
  try {
    const start = performance.now();
    const compressedUri = await RNCompressor.compress(uri, {
      compressionMethod: 'manual',
      quality: QUALITY,
      maxWidth: MAX_WIDTH,
      maxHeight: MAX_HEIGHT,
      output: 'jpg',
    });
    const duration = performance.now() - start;

    // Use nitro's sync getImageInfo to read output metadata (fast, ~0.3ms)
    const info = getImageInfo(compressedUri);

    return {
      library: 'react-native-compressor',
      duration: Math.round(duration),
      outputSize: info.size,
      outputWidth: info.width,
      outputHeight: info.height,
      outputUri: compressedUri,
    };
  } catch (error) {
    return {
      library: 'react-native-compressor',
      duration: 0,
      outputSize: 0,
      outputWidth: 0,
      outputHeight: 0,
      outputUri: '',
      error: String(error),
    };
  }
};
