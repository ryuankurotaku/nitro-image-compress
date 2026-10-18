import type { NitroState } from './types';

export const NITRO_SCREEN_TITLE = '⚡ Nitro Compressor';
export const NITRO_SCREEN_BADGE = 'JSI / Metal';
export const NITRO_SCREEN_BADGE_COLOR = '#10b981';
export const NITRO_SCREEN_SUBTITLE = 'Hardware-accelerated zero-copy image pipeline';

export const NITRO_COMPRESS_OPTIONS = {
  quality: 0.7,
  maxWidth: 1920,
  maxHeight: 1080,
  format: 'jpeg' as const,
};

export const INITIAL_NITRO_STATE: NitroState = {
  sourceUri: null,
  sourceInfo: null,
  result: null,
  duration: null,
  loading: false,
  runCount: 0,
};
