import type { ChartLibraryPalette } from './types';

export const CHART_PALETTES: Record<string, ChartLibraryPalette> = {
  nitro: { color: '#10B981', tag: 'JSI / Metal' },
  resizer: { color: '#3B82F6', tag: 'Bridge' },
  compressor: { color: '#F97316', tag: 'Bridge' },
};

export const DEFAULT_CHART_COLOR = '#64748B';
export const MIN_PROGRESS_WIDTH_PCT = 8;
