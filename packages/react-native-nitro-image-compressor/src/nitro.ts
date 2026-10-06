import { NitroModules } from 'react-native-nitro-modules';
import type { ImageCompressor as ImageCompressorSpec } from './specs/ImageCompressor.nitro';

let _instance: ImageCompressorSpec | undefined;

/**
 * Lazily retrieves or instantiates the ImageCompressor HybridObject.
 */
export function getImageCompressor(): ImageCompressorSpec {
  if (!_instance) {
    _instance =
      NitroModules.createHybridObject<ImageCompressorSpec>('ImageCompressor');
  }
  return _instance;
}

/**
 * HybridImageCompressor instance with lazy resolution on property access.
 */
export const HybridImageCompressor = new Proxy({} as ImageCompressorSpec, {
  get(_target, prop: keyof ImageCompressorSpec) {
    const instance = getImageCompressor();
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
