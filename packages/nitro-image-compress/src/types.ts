import type { HybridObject } from 'react-native-nitro-modules';

export type ImageFormat = 'jpeg' | 'png' | 'webp';

export interface CompressOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: ImageFormat;
  returnBase64?: boolean;
}

export interface CompressResult {
  uri: string;
  width: number;
  height: number;
  size: number;
}

export interface ImageInfo {
  width: number;
  height: number;
  size: number;
  mimeType: string;
}

export interface ImageCompressor
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  compress(uri: string, options: CompressOptions): Promise<CompressResult>;
  getImageInfo(uri: string): ImageInfo;
}
