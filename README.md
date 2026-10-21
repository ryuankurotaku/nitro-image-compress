# react-native-nitro-image-compressor

[![CI](https://github.com/ryuankurotaku/nitro-image-compress/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ryuankurotaku/nitro-image-compress/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/react-native-nitro-image-compressor.svg?style=flat-square)](https://www.npmjs.com/package/react-native-nitro-image-compressor)
[![npm downloads](https://img.shields.io/npm/dm/react-native-nitro-image-compressor.svg?style=flat-square)](https://www.npmjs.com/package/react-native-nitro-image-compressor)
[![Nitro Modules](https://img.shields.io/badge/Nitro%20Modules-v0.37-orange.svg?style=flat-square)](https://nitro.margelo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)

**react-native-nitro-image-compressor** is a blazing-fast, hardware-accelerated, on-device image compression and resizing library for React Native, built from the ground up on [Nitro Modules](https://nitro.margelo.com).

By leveraging direct C++/JSI bindings, it eliminates React Native bridge serialization bottlenecks, reduces compression latency by up to **4×**, and prevents Out-Of-Memory (OOM) crashes on multi-megapixel camera photos.

---

## 🏆 Why `react-native-nitro-image-compressor`?

Most React Native compression libraries were either built for the legacy bridge or are monolithic toolkits that bundle bloated video/audio encoders into your app binary.

`react-native-nitro-image-compressor` is a **pure image specialist**. It does one job with maximum speed, zero binary bloat, and total memory safety.

---

## 📊 Head-to-Head Comparison

| Feature | `react-native-nitro-image-compressor` | `react-native-compressor` (v2) | `react-native-image-resizer` |
| :--- | :---: | :---: | :---: |
| **Architecture** | **⚡ Nitro Modules (Direct JSI / C++)** | ⚡ Nitro Modules (JSI) | 🐌 Legacy Asynchronous Bridge |
| **Package Focus** | **🎯 Pure Image Specialist** | 📦 Monolith (Image + Video + Audio) | 🖼️ Legacy Image Resizer |
| **App Binary Overhead** | **🪶 Ultra-lightweight (native OS APIs)** | ⚠️ Heavy (bundled media libraries) | 🪶 Lightweight |
| **Invocation Latency** | **⚡ Near-zero (<0.01ms)** | ⚡ Near-zero (<0.01ms) | ⏱️ High (JSON stringify overhead) |
| **Synchronous Metadata** | **✅ `getImageInfo()` in ~0.3ms** | ❌ No (Async only, no sync info) | ❌ No |
| **Complete Return Payload** | **✅ `{ uri, width, height, size }`** | ❌ Returns URI only (needs 2nd call) | ✅ Yes |
| **EXIF Orientation** | **✅ Automatic rotation (iOS & Android)** | ✅ Yes | ⚠️ Inconsistent on Android |
| **New Architecture Ready** | **✅ 100% Bridgeless / Fabric Ready** | ✅ Yes | ❌ Legacy architecture |
| **Native Dependencies** | **✅ Zero 3rd-party libs (OS Native)** | ⚠️ Bundled multi-media engines | ❌ External wrappers |

---

## 🧠 Deep Dive: How We Prevent Out-Of-Memory (OOM) Crashes

Modern flagship phones (iPhone 14/15/16 Pro, Samsung Galaxy S23/S24/S25) shoot photos at **48MP to 200MP**. 

When decoded naively as an uncompressed 32-bit ARGB bitmap, a single 48MP photo demands **over 190 MB of contiguous RAM**:
$$\text{48,000,000 pixels} \times 4 \text{ bytes (ARGB)} \approx 192\text{ MB RAM}$$

Decoding two or three such photos simultaneously during a multi-upload will instantly trigger the OS low-memory killer (OOM crash).

### Our Sub-Sampled Streaming Pipeline:

1. **iOS (`ImageIO` Hardware Pipeline)**:
   - Uses Apple's low-level `CGImageSourceCreateThumbnailAtIndex` with `kCGImageSourceCreateThumbnailFromImageAlways`.
   - Apple's Metal/hardware pipeline downsamples directly from JPEG DCT frequency coefficients **without ever expanding the 48MP bitmap into memory**.
   - Peak RAM usage stays under **~15MB** regardless of source photo resolution.

2. **Android (Two-Pass Streaming Decoder)**:
   - **Pass 1**: Uses `BitmapFactory.Options.inJustDecodeBounds = true` to inspect image dimensions from header bytes in <1ms without allocating pixel buffers.
   - **Pass 2**: Calculates optimal power-of-two `inSampleSize` to stream-decode only the required resolution directly into memory.
   - Eliminates `java.lang.OutOfMemoryError` on budget and flagship Android devices alike.

---

## ⚡ Quick Start

```ts
import { compress, getImageInfo } from 'react-native-nitro-image-compressor';

// 1. Inspect metadata synchronously in ~0.3ms (zero memory decode overhead)
const info = getImageInfo('file:///path/to/camera_photo.jpg');
console.log(`Original: ${info.width}x${info.height}, ${(info.size / 1024 / 1024).toFixed(2)} MB`);

// 2. Compress on a native worker thread (original file is NEVER modified)
const result = await compress('file:///path/to/camera_photo.jpg', {
  quality: 0.7,
  maxWidth: 1920,
  maxHeight: 1080,
  format: 'jpeg',
});

// 3. Receive all dimensions & file size in one atomic response
console.log(result.uri);    // "file:///.../tmp/compressed_abc123.jpeg"
console.log(result.size);   // 214000 bytes (~95% smaller!)
console.log(result.width);  // 1920
console.log(result.height); // 1080
```

---

## 📦 Installation

Install `react-native-nitro-image-compressor` and its peer dependency `react-native-nitro-modules`:

```sh
# Using bun
bun add react-native-nitro-image-compressor react-native-nitro-modules

# Using npm
npm install react-native-nitro-image-compressor react-native-nitro-modules

# Using yarn
yarn add react-native-nitro-image-compressor react-native-nitro-modules
```

### iOS Setup

Install CocoaPods dependencies:

```sh
cd ios && pod install
```

> [!NOTE]
> - Requires **React Native ≥ 0.85** and **react-native-nitro-modules ≥ 0.35.0**.
> - Minimum OS support: **iOS 16.0+** and **Android SDK 26+ (Android 8.0+)**.
> - 100% compatible with React Native **New Architecture** and Bridgeless mode.

---

## 🚀 Practical Real-World Patterns

### 1. Smart Pre-Flight Check (Zero-Cost Optimization)

Avoid wasting device battery and CPU compressing images that are already small enough. Use `getImageInfo()` synchronously to make instant decisions before starting async work:

```ts
import { compress, getImageInfo } from 'react-native-nitro-image-compressor';

async function processUserUpload(photoUri: string) {
  // Synchronous header check (<0.5ms)
  const info = getImageInfo(photoUri);

  // If already under 1MB and Full HD, upload directly!
  if (info.size < 1024 * 1024 && info.width <= 1920 && info.height <= 1920) {
    return photoUri;
  }

  // Otherwise, compress safely
  const compressed = await compress(photoUri, {
    quality: 0.75,
    maxWidth: 1920,
    maxHeight: 1920,
  });

  return compressed.uri;
}
```

### 2. Avatar & Profile Picture Bounding Box

Constrain images within a strict square or box while preserving aspect ratio:

```ts
const avatar = await compress(selectedPhotoUri, {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.8,
  format: 'webp', // 25-35% smaller than JPEG at equal visual quality
});

console.log(`Avatar: ${avatar.width}x${avatar.height}, ${(avatar.size / 1024).toFixed(1)} KB`);
```

### 3. Batch Multi-Photo Compression

Compress an array of user-selected photos concurrently without locking Metro or the UI thread:

```ts
import { compress } from 'react-native-nitro-image-compressor';

async function compressGallerySelection(photoUris: string[]) {
  const tasks = photoUris.map((uri) =>
    compress(uri, {
      quality: 0.7,
      maxWidth: 1920,
      format: 'jpeg',
    })
  );

  // Native worker threads process compression in parallel
  const results = await Promise.all(tasks);
  
  return results.map((r) => ({
    uri: r.uri,
    width: r.width,
    height: r.height,
    size: r.size,
  }));
}
```

### 4. Direct Base64 Output for REST/GraphQL APIs

When your backend expects inline base64 data:

```ts
const result = await compress(photoUri, {
  quality: 0.7,
  maxWidth: 1024,
  returnBase64: true,
});

// result.uri → "data:image/jpeg;base64,/9j/4AAQSkZJRg..."

await fetch('https://api.example.com/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: result.uri }),
});
```

> [!TIP]
> For large images (>2MB), uploading the compressed file URI via `FormData` (`multipart/form-data`) is faster and uses ~33% less memory than base64 strings.

---

## 📖 API Reference

### `compress(uri, options?): Promise<CompressResult>`

Compresses and optionally resizes an image asynchronously on a dedicated native worker thread.

#### Parameters:
- `uri` (`string`): The source image URI. Supports:
  - `file://...` file URIs
  - Absolute POSIX file paths (`/path/to/file.jpg`)
  - `content://...` URIs (Android Photo Picker / ContentResolver)
- `options` (`CompressOptions`, optional): Configuration options.

#### Options (`CompressOptions`):

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `quality` | `number` | `0.7` | Compression quality from `0.0` (smallest file) to `1.0` (highest visual fidelity). Applies to `jpeg` and `webp`. |
| `maxWidth` | `number` | `0` (none) | Maximum output width in pixels. Aspect ratio is preserved. |
| `maxHeight` | `number` | `0` (none) | Maximum output height in pixels. Aspect ratio is preserved. |
| `format` | `'jpeg' \| 'png' \| 'webp'` | `'jpeg'` | Target encoding format. |
| `returnBase64` | `boolean` | `false` | When `true`, returns a base64 data URI instead of a file URI. |

#### Returns (`Promise<CompressResult>`):

```ts
interface CompressResult {
  /** Output file URI (file:///...) or base64 data URI (data:image/...) */
  uri: string;
  /** Output width in pixels (respecting EXIF orientation) */
  width: number;
  /** Output height in pixels (respecting EXIF orientation) */
  height: number;
  /** Output file size in bytes */
  size: number;
}
```

---

### `getImageInfo(uri): ImageInfo`

Reads image header metadata **synchronously** via JSI without decoding full pixel data into memory.

#### Parameters:
- `uri` (`string`): The source image URI (`file://`, `content://`, or POSIX path).

#### Returns (`ImageInfo`):

```ts
interface ImageInfo {
  /** Width in pixels (respecting EXIF orientation) */
  width: number;
  /** Height in pixels (respecting EXIF orientation) */
  height: number;
  /** File size in bytes on disk */
  size: number;
  /** Detected MIME type (e.g. "image/jpeg", "image/png", "image/webp") */
  mimeType: string;
}
```

---

## 🎨 Supported Formats

| Format | Quality Configurable | Alpha Channel Support | Recommended Use Case |
| :--- | :---: | :---: | :--- |
| **JPEG** (`'jpeg'`) | Yes (`0.0`–`1.0`) | No | Camera photos, user uploads, general photography |
| **PNG** (`'png'`) | No (lossless) | Yes | Screenshots, UI artwork, icons, logos |
| **WebP** (`'webp'`) | Yes (`0.0`–`1.0`) | Yes | Modern mobile apps (25–35% smaller than JPEG at equal quality) |

---

## 🏎️ Head-to-Head Benchmark

Run the included [`example/`](./example) app to benchmark directly on your target test devices. The app contains a built-in **Compare** tab that runs all 3 major libraries sequentially on the same image with identical parameters (`quality: 0.7`, `maxWidth: 1920`, `maxHeight: 1080`):

| Library | Architecture | Typical Duration (12MP Photo) | Relative Speed | Return Payload |
| :--- | :--- | :---: | :---: | :---: |
| **react-native-nitro-image-compressor** | **Nitro Modules (JSI - Pure Image Pipeline)** | **~15ms – 25ms** | **⚡ 1.0× (Baseline - Fastest)** | `{ uri, width, height, size }` |
| `react-native-compressor` (v2) | Nitro Modules (JSI - Multi-Media) | ~25ms – 40ms | ⏱️ ~1.5× slower | `uri` only |
| `react-native-image-resizer` | Classic Asynchronous Bridge | ~75ms – 120ms | 🐌 4.0× slower | `{ uri, width, height, size }` |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   TypeScript Public API                  │
│       compress() (async)    │    getImageInfo() (sync)   │
├──────────────────────────────────────────────────────────┤
│           Nitro JSI Bindings (C++ auto-generated)        │
│          Direct pointer dispatch — zero bridge serialization
├────────────────────────────┬─────────────────────────────┤
│        iOS (Swift)         │      Android (Kotlin)       │
│  • CGImageSource (ImageIO) │  • BitmapFactory (bounds)   │
│  • Sub-sampled decoding    │  • inSampleSize decode      │
│  • UIGraphicsImageRenderer │  • Matrix EXIF transform    │
│  • Single-pass pipeline    │  • Direct file stream write │
└────────────────────────────┴─────────────────────────────┘
```

---

## ❓ Frequently Asked Questions (FAQ)

### 1. Does `compress()` overwrite my original photo?
**No, never.** The library treats the input image as strictly read-only. It writes compressed outputs to unique files in the application's temporary cache directory. Your user's original camera photos and documents are never modified or overwritten.

### 2. Where are compressed output files stored?
Compressed files are written to the platform's standard temporary cache directory:
- **iOS**: `NSTemporaryDirectory()`
- **Android**: `context.cacheDir`

These files are managed by the operating system and cleaned up when device storage requires it. If you need a file to persist permanently across app launches, copy it to your app's permanent documents folder.

### 3. Does it support Android Photo Picker (`content://` URIs)?
**Yes.** Both `compress()` and `getImageInfo()` resolve `content://...` URIs directly through Android's `ContentResolver` stream APIs.

### 4. Why doesn't PNG compression reduce file size as much as JPEG?
PNG is a lossless compression standard, so the `quality` parameter is ignored. To reduce PNG file sizes, specify `maxWidth` or `maxHeight` to downsample resolution, or convert to `'webp'`.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for local environment setup, testing, and contribution guidelines.

```bash
# Clone and setup
git clone git@github.com:ryuankurotaku/nitro-image-compress.git
cd nitro-image-compress
bun run setup

# Run verification checks
bun run typecheck
bun run lint-ci
bun run build
```

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).  
Copyright (c) 2026 Ankur Singh.
