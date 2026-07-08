import Foundation
import NitroModules

/// Registers the `ImageCompressor` HybridObject with Nitro's runtime registry.
///
/// This class is discovered automatically by Nitro's autolinking system during app startup.
/// When JavaScript calls `NitroModules.createHybridObject('ImageCompressor')`,
/// Nitro looks up this registration and instantiates a new `HybridImageCompressor`.
///
/// Each call creates a fresh instance — there is no shared singleton.
class ImageCompressorAutolinking: HybridObjectRegistrar {
  static func registerHybridObjects() {
    HybridObjectRegistry.shared.registerHybridObjectConstructor(
      "ImageCompressor"
    ) {
      return HybridImageCompressor()
    }
  }
}
