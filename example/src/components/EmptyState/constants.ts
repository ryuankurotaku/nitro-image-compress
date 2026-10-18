import type { EmptyStateFeature } from './types';

export const DEFAULT_EMPTY_STATE_TITLE = 'No Image Selected';
export const DEFAULT_EMPTY_STATE_DESCRIPTION =
  'Choose a high-resolution photo from your library to test performance.';
export const DEFAULT_EMPTY_STATE_BUTTON_LABEL = 'Select Photo from Library';

export const DEFAULT_EMPTY_STATE_FEATURES: EmptyStateFeature[] = [
  { icon: '⚡', label: 'Metal GPU' },
  { icon: '🧠', label: 'Zero-Copy' },
  { icon: '📐', label: '1080p • 70%' },
];
