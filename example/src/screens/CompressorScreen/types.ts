import type { ImageInfo } from 'react-native-nitro-image-compressor';

export interface CompressorResult {
  uri: string;
  width: number;
  height: number;
  size: number;
}

export interface CompressorState {
  sourceUri: string | null;
  sourceInfo: ImageInfo | null;
  result: CompressorResult | null;
  duration: number | null;
  loading: boolean;
  runCount: number;
}

export type CompressorAction =
  | { type: 'SET_SOURCE'; payload: { uri: string; info: ImageInfo } }
  | { type: 'START_COMPRESS' }
  | { type: 'COMPRESS_SUCCESS'; payload: { result: CompressorResult; duration: number } }
  | { type: 'COMPRESS_FAILURE' };
