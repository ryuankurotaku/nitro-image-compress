export interface BenchmarkResult {
  library: string;
  duration: number;
  outputSize: number;
  outputWidth: number;
  outputHeight: number;
  outputUri: string;
  error?: string;
}

export interface ImageSource {
  uri: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
}
