package com.nitroimagecompressexample

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.margelo.nitro.imagecompress.NitroImageCompressPackage

class MainApplication : Application(), ReactApplication {

  companion object {
    init {
      try {
        System.loadLibrary("NitroImageCompress")
      } catch (e: Throwable) {
        android.util.Log.e("MainApplication", "Failed to load NitroImageCompress library", e)
      }
    }
  }

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here:
          add(NitroImageCompressPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
