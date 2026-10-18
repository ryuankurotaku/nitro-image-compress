import type { CompressorState } from './types';

export const COMPRESSOR_SCREEN_TITLE = '🗜️ RN Compressor';
export const COMPRESSOR_SCREEN_BADGE = 'Bridge / Native';
export const COMPRESSOR_SCREEN_BADGE_COLOR = '#f97316';
export const COMPRESSOR_SCREEN_SUBTITLE = 'Community native bridge compression module';

export const COMPRESSOR_OPTIONS = {
  compressionMethod: 'manual' as const,
  quality: 0.7,
  maxWidth: 1920,
  maxHeight: 1080,
  output: 'jpg' as const,
};

export const INITIAL_COMPRESSOR_STATE: CompressorState = {
  sourceUri: null,
  sourceInfo: null,
  result: null,
  duration: null,
  loading: false,
  runCount: 0,
};
