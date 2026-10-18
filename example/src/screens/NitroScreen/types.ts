import type { CompressResult, ImageInfo } from 'react-native-nitro-image-compressor';

export interface NitroState {
  sourceUri: string | null;
  sourceInfo: ImageInfo | null;
  result: CompressResult | null;
  duration: number | null;
  loading: boolean;
  runCount: number;
}

export type NitroAction =
  | { type: 'SET_SOURCE'; payload: { uri: string; info: ImageInfo } }
  | { type: 'START_COMPRESS' }
  | { type: 'COMPRESS_SUCCESS'; payload: { result: CompressResult; duration: number } }
  | { type: 'COMPRESS_FAILURE' };
