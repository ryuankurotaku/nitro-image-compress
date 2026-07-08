package com.nitro.imagecompress

import android.content.Context
import com.margelo.nitro.core.HybridObjectRegistry

/**
 * Registers the `ImageCompressor` HybridObject with Nitro's runtime registry.
 *
 * This class is discovered automatically by Nitro's Android autolinking system.
 * When JavaScript calls `NitroModules.createHybridObject('ImageCompressor')`,
 * Nitro looks up this registration and instantiates a new [HybridImageCompressor].
 *
 * The [Context] is required by the underlying Compressor library for cache directory access.
 *
 * @param context Application context passed from the React Native host
 */
class ImageCompressorPackage(private val context: Context) : com.margelo.nitro.core.NitroPackage {
    override fun registerHybridObjects() {
        HybridObjectRegistry.registerHybridObjectConstructor("ImageCompressor") {
            HybridImageCompressor(context)
        }
    }
}
