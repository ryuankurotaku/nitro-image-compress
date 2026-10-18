import { DEFAULT_LIBRARY_DISPLAY_CONFIG, LIBRARY_DISPLAY_CONFIGS } from './constants';
import type { LibraryDisplayConfig } from './types';

export const getLibraryConfig = (library: string): LibraryDisplayConfig => {
  const lower = library.toLowerCase();
  for (const [key, cfg] of Object.entries(LIBRARY_DISPLAY_CONFIGS)) {
    if (lower.includes(key)) {
      return cfg;
    }
  }
  return DEFAULT_LIBRARY_DISPLAY_CONFIG;
};
