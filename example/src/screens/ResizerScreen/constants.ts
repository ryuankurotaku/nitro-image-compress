import type { ResizerState } from './types';

export const RESIZER_SCREEN_TITLE = '🖼️ Image Resizer';
export const RESIZER_SCREEN_BADGE = 'Bridge / CG';
export const RESIZER_SCREEN_BADGE_COLOR = '#3b82f6';
export const RESIZER_SCREEN_SUBTITLE = 'Classic React Native asynchronous bridge';

export const RESIZER_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1080,
  format: 'JPEG' as const,
  quality: 70,
  rotation: 0,
};

export const INITIAL_RESIZER_STATE: ResizerState = {
  sourceUri: null,
  sourceInfo: null,
  result: null,
  duration: null,
  loading: false,
  runCount: 0,
};
