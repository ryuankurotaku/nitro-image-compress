import { Image as RNCompressor } from 'react-native-compressor';
import ImageResizer from 'react-native-image-resizer';
import { getImageInfo, compress as nitroCompress } from 'react-native-nitro-image-compressor';
import type { BenchmarkResult, ImageSource } from '../../types';
import {
  BENCHMARK_INTER_LIB_DELAY_MS,
  BENCHMARK_MAX_HEIGHT,
  BENCHMARK_MAX_WIDTH,
  BENCHMARK_QUALITY,
} from './constants';

/**
 * Runs a compression benchmark across all three libraries sequentially.
 *
 * Each library compresses the same source image with identical parameters.
 * Results include wall-clock timing via `performance.now()`.
 *
 * Libraries tested:
 * 1. **react-native-nitro-image-compressor** — JSI/Nitro (pure image specialist)
 * 2. **react-native-image-resizer** — Legacy bridge architecture
 * 3. **react-native-compressor** — Nitro Modules (v2)
 *
 * @param source - The source image to compress (from image picker)
 * @returns Array of benchmark results, one per library
 */
export const runBenchmark = async (source: ImageSource): Promise<BenchmarkResult[]> => {
  const results: BenchmarkResult[] = [];

  // Run sequentially to avoid CPU contention affecting timing
  results.push(await benchmarkNitro(source.uri));
  await new Promise((resolve) => setTimeout(resolve, BENCHMARK_INTER_LIB_DELAY_MS));
  results.push(await benchmarkImageResizer(source.uri));
  await new Promise((resolve) => setTimeout(resolve, BENCHMARK_INTER_LIB_DELAY_MS));
  results.push(await benchmarkRNCompressor(source.uri));

  return results;
};

/**
 * Benchmarks react-native-nitro-image-compressor (this library).
 * Uses JSI for near-zero overhead function calls.
 */
const benchmarkNitro = async (uri: string): Promise<BenchmarkResult> => {
  try {
    const start = performance.now();
    const result = await nitroCompress(uri, {
      quality: BENCHMARK_QUALITY,
      maxWidth: BENCHMARK_MAX_WIDTH,
      maxHeight: BENCHMARK_MAX_HEIGHT,
      format: 'jpeg',
    });
    const duration = performance.now() - start;

    return {
      library: 'react-native-nitro-image-compressor',
      duration: Math.round(duration),
      outputSize: result.size,
      outputWidth: result.width,
      outputHeight: result.height,
      outputUri: result.uri,
    };
  } catch (error) {
    return {
      library: 'react-native-nitro-image-compressor',
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
      BENCHMARK_MAX_WIDTH,
      BENCHMARK_MAX_HEIGHT,
      'JPEG',
      Math.round(BENCHMARK_QUALITY * 100), // This lib expects 0-100 integer
      0, // rotation
      undefined, // output path (use default temp)
      false, // keep metadata
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
 * Benchmarks react-native-compressor (v2 Nitro).
 * Uses Nitro Modules JSI with manual compression mode.
 * Output metadata is read via nitro's sync `getImageInfo` since react-native-compressor
 * returns only the output URI rather than dimensions/size in its response.
 */
const benchmarkRNCompressor = async (uri: string): Promise<BenchmarkResult> => {
  try {
    const start = performance.now();
    const compressedUri = await RNCompressor.compress(uri, {
      compressionMethod: 'manual',
      quality: BENCHMARK_QUALITY,
      maxWidth: BENCHMARK_MAX_WIDTH,
      maxHeight: BENCHMARK_MAX_HEIGHT,
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
