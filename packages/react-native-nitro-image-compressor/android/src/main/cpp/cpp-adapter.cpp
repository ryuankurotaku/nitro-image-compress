#include <jni.h>
#include <fbjni/fbjni.h>
#include "NitroImageCompressOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::imagecompress::initialize(vm);
}
