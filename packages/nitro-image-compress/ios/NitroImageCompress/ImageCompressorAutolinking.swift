import Foundation
import NitroModules

/// Factory that registers the ImageCompressor HybridObject with Nitro.
class ImageCompressorAutolinking: HybridObjectRegistrar {
  static func registerHybridObjects() {
    HybridObjectRegistry.shared.registerHybridObjectConstructor(
      "ImageCompressor"
    ) {
      return HybridImageCompressor()
    }
  }
}
