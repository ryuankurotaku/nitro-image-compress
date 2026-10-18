import type { LibraryDisplayConfig } from './types';

export const LIBRARY_DISPLAY_CONFIGS: Record<string, LibraryDisplayConfig> = {
  nitro: {
    color: '#10B981',
    badge: 'JSI / Metal GPU',
    icon: '⚡',
  },
  resizer: {
    color: '#3B82F6',
    badge: 'Bridge / CG',
    icon: '🖼️',
  },
  compressor: {
    color: '#F97316',
    badge: 'Bridge / Native',
    icon: '🗜️',
  },
};

export const DEFAULT_LIBRARY_DISPLAY_CONFIG: LibraryDisplayConfig = {
  color: '#64748B',
  badge: 'Library',
  icon: '📦',
};
