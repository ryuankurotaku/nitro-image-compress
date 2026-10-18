export interface EmptyStateFeature {
  icon: string;
  label: string;
}

export interface EmptyStateProps {
  onPickPress: () => void;
  title?: string;
  description?: string;
  buttonLabel?: string;
  features?: EmptyStateFeature[];
}
