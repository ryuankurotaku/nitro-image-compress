import type { CompareState } from './types';

export const COMPARE_SCREEN_TITLE = '🏎️ Head-to-Head';
export const COMPARE_SCREEN_BADGE = 'BENCHMARK';
export const COMPARE_SCREEN_BADGE_COLOR = '#4f46e5';
export const COMPARE_SCREEN_SUBTITLE = 'Same image, same params, 3 libraries';
export const BENCHMARK_DISPATCH_DELAY_MS = 50;

export const BENCHMARK_QUALITY = 0.7; // 70% JPEG quality
export const BENCHMARK_MAX_WIDTH = 1920; // Full HD width cap
export const BENCHMARK_MAX_HEIGHT = 1080; // Full HD height cap
export const BENCHMARK_INTER_LIB_DELAY_MS = 20;

export const INITIAL_COMPARE_STATE: CompareState = {
  source: null,
  results: [],
  loading: false,
  runCount: 0,
};
