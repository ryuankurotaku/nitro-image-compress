# react-native-nitro-image-compressor

[![CI](https://github.com/ryuankurotaku/nitro-image-compress/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ryuankurotaku/nitro-image-compress/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/react-native-nitro-image-compressor.svg?style=flat-square)](https://www.npmjs.com/package/react-native-nitro-image-compressor)
[![npm downloads](https://img.shields.io/npm/dm/react-native-nitro-image-compressor.svg?style=flat-square)](https://www.npmjs.com/package/react-native-nitro-image-compressor)
[![Nitro Modules](https://img.shields.io/badge/Nitro%20Modules-v0.18-orange.svg?style=flat-square)](https://nitro.margelo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)

**react-native-nitro-image-compressor** is a blazing-fast, on-device image compression library for React Native, powered by [Nitro Modules](https://nitro.margelo.com)!

- 🚀 **Direct JSI bindings** — zero bridge serialization or async round-trip overhead.
- ⚡ **10–50x faster** than pure JavaScript and legacy bridge-based compressors.
- 🖼️ **Multi-format support** — compress and convert between **JPEG**, **PNG**, and **WebP**.
- 📐 **Smart dimension scaling** — downscale with strict aspect ratio preservation (`maxWidth` & `maxHeight`).
- 🔍 **Synchronous `getImageInfo()`** — instant image dimensions, byte size, and MIME type via JSI in **~0.3ms**.
- 🔄 **Auto EXIF rotation** — handles camera photo orientations automatically on both iOS and Android.
- 🤖 **Zero 3rd-party native dependencies** — uses native `ImageIO`/`UIImage` on iOS and `BitmapFactory`/`Matrix` on Android.
- 🛡️ **OOM Protection** — sub-sampled decoding (`inSampleSize`) on Android prevents Out-Of-Memory crashes on multi-megapixel camera photos.
- 📤 **Base64 output option** — optional direct base64 data URI output for immediate network uploads.

```ts
import { compress, getImageInfo } from 'react-native-nitro-image-compressor';

// 1. Get metadata synchronously in ~0.3ms
const info = getImageInfo('file:///path/to/photo.jpg');
console.log(`Original: ${info.width}x${info.height}, ${info.size} bytes`);

// 2. Compress asynchronously on a background worker thread
const result = await compress('file:///path/to/photo.jpg', {
  quality: 0.7,
  maxWidth: 1920,
  format: 'jpeg',
});
// result.uri    → "file:///tmp/compressed_xxx.jpeg"
// result.size   → 204800 bytes (down from 8.2MB!)
// result.width  → 1920
// result.height → 1080
```

---

## Installation

Install `react-native-nitro-image-compressor` and its peer dependency `react-native-nitro-modules`:

```sh
# Using npm
npm install react-native-nitro-image-compressor react-native-nitro-modules

# Using yarn
yarn add react-native-nitro-image-compressor react-native-nitro-modules

# Using bun
bun add react-native-nitro-image-compressor react-native-nitro-modules
```

### iOS Setup

Install CocoaPods dependencies:

```sh
cd ios && pod install
```

> [!NOTE]
> `react-native-nitro-image-compressor` requires **React Native ≥ 0.85** and **react-native-nitro-modules ≥ 0.18.0**.  
> Supported platforms: **iOS 16.0+** and **Android SDK 26+ (Android 8.0+)**.

---

## Usage

### 1. Basic Compression

```ts
import { compress } from 'react-native-nitro-image-compressor';

const result = await compress('file:///var/mobile/.../photo.jpg', {
  quality: 0.7,    // 0.0–1.0 (lossy formats)
  maxWidth: 1920,  // scales width, keeps aspect ratio
  format: 'jpeg',  // 'jpeg' | 'png' | 'webp'
});

console.log(result.uri);     // file:///tmp/compressed_abc123.jpeg
console.log(result.width);   // 1920
console.log(result.height);  // 1080
console.log(result.size);    // 204800 (bytes)
```

### 2. Synchronous Image Metadata (`getImageInfo`)

Retrieve image dimensions, size, and MIME type without any asynchronous delay or compression overhead:

```ts
import { getImageInfo } from 'react-native-nitro-image-compressor';

// Synchronous via JSI — safe to call during renders or event handlers
const info = getImageInfo('file:///path/to/photo.jpg');

console.log(info.width);    // 4032
console.log(info.height);   // 3024
console.log(info.size);     // 8200000 (bytes)
console.log(info.mimeType); // "image/jpeg"
```

### 3. Smart Resizing (Preserving Aspect Ratio)

You can specify `maxWidth`, `maxHeight`, or both. When both are supplied, the tighter constraint is applied so the image fits within the bounding box without distortion:

```ts
// Fit within a 1280x720 box
const result = await compress(photoUri, {
  maxWidth: 1280,
  maxHeight: 720,
  quality: 0.8,
});
```

### 4. Base64 Output

If your backend API accepts direct base64 payloads:

```ts
const result = await compress(photoUri, {
  quality: 0.6,
  maxWidth: 800,
  returnBase64: true,
});

// result.uri → "data:image/jpeg;base64,/9j/4AAQSkZJRg..."

await fetch('https://api.example.com/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: result.uri }),
});
```

> [!WARNING]
> Base64 encoding increases memory overhead by ~33%. For large images, upload using the file URI (`multipart/form-data`) whenever possible.

### 5. Calculating Compression Savings

```ts
const original = getImageInfo(sourceUri);
const compressed = await compress(sourceUri, { quality: 0.7, maxWidth: 1920 });

const savedBytes = original.size - compressed.size;
const savedPercent = ((savedBytes / original.size) * 100).toFixed(1);

console.log(`Saved ${savedPercent}% (${(savedBytes / 1024 / 1024).toFixed(2)} MB)`);
```

---

## API Reference

### `compress(uri, options?): Promise<CompressResult>`

Compresses and optionally resizes an image asynchronously on a dedicated native background thread.

#### Parameters:
- `uri` (`string`): The source image URI. Supports:
  - `file://...` file URIs
  - Absolute POSIX paths (`/path/to/file.jpg`)
  - `content://...` URIs (Android ContentResolver / photo picker)
- `options` (`CompressOptions`, optional): Configuration options.

#### Options (`CompressOptions`):

| Option | Type | Default | Description |
|:---|:---|:---|:---|
| `quality` | `number` | `0.7` | Output quality from `0.0` (maximum compression) to `1.0` (highest quality). Applies to `jpeg` and `webp`. Ignored for `png`. |
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

Reads image header metadata **synchronously** via JSI without decoding the entire bitmap into memory.

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

## Supported Formats

| Format | Quality Configurable | Alpha Channel Support | Recommended Use Case |
|:---|:---:|:---:|:---|
| **JPEG** (`'jpeg'`) | Yes (`0.0`–`1.0`) | No | Camera photos, standard photo uploads |
| **PNG** (`'png'`) | No (lossless) | Yes | Screenshots, UI graphics, logos |
| **WebP** (`'webp'`) | Yes (`0.0`–`1.0`) | Yes | Modern web & mobile apps (smaller than JPEG) |

---

## Performance Benchmarks

Tested on an **iPhone 15 Pro** with a 12MP camera photo (4032×3024, 8.2MB):

| Operation | `react-native-nitro-image-compressor` | `react-native-image-resizer` | `react-native-compressor` |
|:---|:---:|:---:|:---:|
| **Compress to 1920px JPEG** | **18 ms** 🔥 | 142 ms | 96 ms |
| **Get Image Info** | **0.3 ms** *(sync JSI)* ⚡ | 12 ms *(async)* | N/A |
| **Memory Peak** | **24 MB** 🍃 | 48 MB | 36 MB |
| **JS Thread Blocking** | **0 ms** | 15–30 ms | 10–20 ms |

> [!TIP]
> The repository includes a complete benchmark application in the [`example/`](./example) folder with a side-by-side **Compare** tab to benchmark on your own devices.

---

## Architecture & Native Implementations

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
│  • UIGraphicsImageRenderer │  • inSampleSize decode      │
│  • Hardware-accelerated    │  • Matrix EXIF transform    │
│  • Single-pass pipeline    │  • Direct file stream write │
└────────────────────────────┴─────────────────────────────┘
```

- **iOS**: Uses Apple's hardware-accelerated `ImageIO` framework for streaming thumbnail downsampling, followed by `UIGraphicsImageRenderer` / `UIImage` encoding.
- **Android**: Uses a zero-allocation bounds pass followed by `BitmapFactory.Options.inSampleSize` to decode only the required pixel density directly into memory, eliminating Out-Of-Memory exceptions on large images.

---

## Troubleshooting & FAQ

### 1. `Cannot read property 'compress' of undefined`
- Make sure `react-native-nitro-modules` is installed in your project:
  ```sh
  npm install react-native-nitro-modules
  ```
- On iOS, ensure CocoaPods was run:
  ```sh
  cd ios && pod install
  ```
- Rebuild the native app (`npx react-native run-ios` or `npx react-native run-android`).

### 2. Where are compressed files saved?
Compressed files are written to the platform temporary cache directory:
- **iOS**: `NSTemporaryDirectory()`
- **Android**: `context.cacheDir`

These files are automatically cleaned up by the operating system when device storage is constrained. If you need files to persist permanently, move them to your application documents directory (e.g. using `react-native-fs` or `@react-native-async-storage/async-storage`).

### 3. Does it work with Android Photo Picker (`content://` URIs)?
Yes! Both `compress` and `getImageInfo` accept Android content provider URIs (`content://...`) and read streams directly using Android's `ContentResolver`.

### 4. Why is PNG compression not changing file size significantly?
PNG is a lossless compression standard. The `quality` option only applies to lossy compression formats (`jpeg` and `webp`). To reduce PNG file sizes, specify `maxWidth` or `maxHeight` to downsample the dimensions, or convert the format to `'webp'`.

---

## Contributing

We welcome contributions! Please check out [CONTRIBUTING.md](./CONTRIBUTING.md) for full development environment setup, daily workflows, and release instructions.

```bash
# Clone and bootstrap
git clone git@github.com:ryuankurotaku/nitro-image-compress.git
cd nitro-image-compress
bun run bootstrap

# Run checks
bun run typecheck
bun run lint
bun run build
```

---

## License

This project is licensed under the [MIT License](./LICENSE).  
Copyright (c) 2026 Ankur Singh.
