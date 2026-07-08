import { compress as nitroCompress, getImageInfo } from 'nitro-image-compress';
import ImageResizer from 'react-native-image-resizer';
import { Image as RNCompressor } from 'react-native-compressor';
import type { BenchmarkResult, ImageSource } from './types.js';

const QUALITY = 0.7;
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

/**
 * Run compression benchmark across all three libraries.
 */
export const runBenchmark = async (
  source: ImageSource,
): Promise<BenchmarkResult[]> => {
  const results: BenchmarkResult[] = [];

  // 1. nitro-image-compress
  results.push(await benchmarkNitro(source.uri));

  // 2. react-native-image-resizer
  results.push(await benchmarkImageResizer(source.uri));

  // 3. react-native-compressor
  results.push(await benchmarkRNCompressor(source.uri));

  return results;
};

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

const benchmarkImageResizer = async (uri: string): Promise<BenchmarkResult> => {
  try {
    const start = performance.now();
    const result = await ImageResizer.createResizedImage(
      uri,
      MAX_WIDTH,
      MAX_HEIGHT,
      'JPEG',
      Math.round(QUALITY * 100),
      0,
      undefined,
      false,
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

    // Get output info using nitro's sync getImageInfo
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
