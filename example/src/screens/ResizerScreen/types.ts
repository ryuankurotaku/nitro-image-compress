import type { ImageInfo } from 'react-native-nitro-image-compressor';

export interface ResizerResult {
  uri: string;
  width: number;
  height: number;
  size: number;
}

export interface ResizerState {
  sourceUri: string | null;
  sourceInfo: ImageInfo | null;
  result: ResizerResult | null;
  duration: number | null;
  loading: boolean;
  runCount: number;
}

export type ResizerAction =
  | { type: 'SET_SOURCE'; payload: { uri: string; info: ImageInfo } }
  | { type: 'START_COMPRESS' }
  | { type: 'COMPRESS_SUCCESS'; payload: { result: ResizerResult; duration: number } }
  | { type: 'COMPRESS_FAILURE' };
