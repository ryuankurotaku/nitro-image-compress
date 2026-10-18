import type { BenchmarkResult, ImageSource } from '../../types';

export interface CompareState {
  source: ImageSource | null;
  results: BenchmarkResult[];
  loading: boolean;
  runCount: number;
}

export type CompareAction =
  | { type: 'SET_SOURCE'; payload: ImageSource }
  | { type: 'START_BENCHMARK' }
  | { type: 'BENCHMARK_SUCCESS'; payload: BenchmarkResult[] }
  | { type: 'BENCHMARK_FAILURE' };
