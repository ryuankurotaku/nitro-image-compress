package com.nitro.imagecompress

import android.content.Context
import com.margelo.nitro.core.HybridObjectRegistry

/**
 * Registers the ImageCompressor HybridObject with Nitro's autolinking system.
 */
class ImageCompressorPackage(private val context: Context) : com.margelo.nitro.core.NitroPackage {
    override fun registerHybridObjects() {
        HybridObjectRegistry.registerHybridObjectConstructor("ImageCompressor") {
            HybridImageCompressor(context)
        }
    }
}
