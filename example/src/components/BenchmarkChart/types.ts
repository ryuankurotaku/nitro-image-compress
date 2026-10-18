import type { BenchmarkResult } from '../../types';

export interface BenchmarkChartProps {
  results: BenchmarkResult[];
}

export interface ChartLibraryPalette {
  color: string;
  tag: string;
}
