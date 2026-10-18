import { CHART_PALETTES } from './constants';
import type { ChartLibraryPalette } from './types';

export interface LibraryBenchmarkConfig extends ChartLibraryPalette {
  name: string;
  bgLight: string;
  badgeColor: string;
}

export const getLibraryConfig = (library: string): LibraryBenchmarkConfig => {
  const lower = library.toLowerCase();
  if (lower.includes('nitro')) {
    const palette = CHART_PALETTES.nitro ?? { color: '#10b981', tag: 'JSI / Metal' };
    return {
      name: 'Nitro Compressor',
      tag: palette.tag,
      color: palette.color,
      bgLight: '#ecfdf5',
      badgeColor: '#059669',
    };
  }
  if (lower.includes('resizer')) {
    const palette = CHART_PALETTES.resizer ?? { color: '#3b82f6', tag: 'Bridge' };
    return {
      name: 'Image Resizer',
      tag: palette.tag,
      color: palette.color,
      bgLight: '#eff6ff',
      badgeColor: '#2563eb',
    };
  }
  const palette = CHART_PALETTES.compressor ?? { color: '#f97316', tag: 'Bridge' };
  return {
    name: 'RN Compressor',
    tag: palette.tag,
    color: palette.color,
    bgLight: '#fff7ed',
    badgeColor: '#ea580c',
  };
};
