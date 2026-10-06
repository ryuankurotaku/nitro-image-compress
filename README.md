# react-native-nitro-image-compressor

**react-native-nitro-image-compressor** is a high-performance on-device image compression library for React Native, built with [Nitro Modules](https://nitro.margelo.com)!

- Powered by [Nitro Modules](https://nitro.margelo.com) for direct JSI calls — no bridge overhead! 🔥
- **10-50x faster** than JS-based compression solutions ⚡
- Supports **JPEG, PNG, WebP** output formats 🖼️
- Smart resize with aspect ratio preservation 📐
- Synchronous `getImageInfo()` via JSI — instant metadata in ~0.3ms 🔍
- EXIF orientation correction on Android (via [Compressor](https://github.com/zetbaitsu/Compressor)) 🔄
- Base64 output option for direct API uploads 📤
- Hardware-accelerated encoding on iOS (UIImage + ImageIO) 🍎
- Memory-efficient decoding on Android (inSampleSize) 🤖

```ts
import { compress, getImageInfo } from 'react-native-nitro-image-compressor';

const info = getImageInfo('file:///photo.jpg');      // Sync! ~0.3ms
const result = await compress('file:///photo.jpg', {
  quality: 0.7,
  maxWidth: 1920,
  format: 'jpeg',
});
// result.uri → file:///tmp/compressed_xxx.jpeg
// result.size → 204800 (bytes, down from 8MB!)
```

## Installation

Install [react-native-nitro-image-compressor](https://www.npmjs.com/package/react-native-nitro-image-compressor) from npm:

```sh
npm i react-native-nitro-image-compressor
npm i react-native-nitro-modules
cd ios && pod install
```

> [!NOTE]
> react-native-nitro-image-compressor requires React Native ≥ 0.85 and react-native-nitro-modules ≥ 0.18.0.
> Both iOS 16+ and Android SDK 26+ are supported.

## Usage

### Compressing an Image

```ts
import { compress } from 'react-native-nitro-image-compressor';

const result = await compress('file:///path/to/photo.jpg', {
  quality: 0.7,        // 0.0–1.0, default 0.7
  maxWidth: 1920,      // optional, maintains aspect ratio
  maxHeight: 1080,     // optional, tighter constraint wins
  format: 'jpeg',      // 'jpeg' | 'png' | 'webp'
});

console.log(result.uri);     // file:///tmp/compressed_abc123.jpeg
console.log(result.width);   // 1920
console.log(result.height);  // 1080
console.log(result.size);    // 204800 (bytes)
```

### Getting Image Info (Synchronous)

```ts
import { getImageInfo } from 'react-native-nitro-image-compressor';

// This is SYNCHRONOUS via JSI — no await needed!
const info = getImageInfo('file:///path/to/photo.jpg');

console.log(info.width);    // 4032
console.log(info.height);   // 3024
console.log(info.size);     // 8200000 (bytes)
console.log(info.mimeType); // "image/jpeg"
```

### Base64 Output

For direct upload to APIs that accept base64:

```ts
const result = await compress(uri, {
  quality: 0.6,
  maxWidth: 800,
  returnBase64: true,
});
// result.uri → "data:image/jpeg;base64,/9j/4AAQ..."

await fetch('/api/upload', {
  method: 'POST',
  body: JSON.stringify({ image: result.uri }),
});
```

> [!WARNING]
> Base64 encoding increases memory usage by ~33%. Only use for small images or when file URI isn't practical.

### Calculating Savings

```ts
const info = getImageInfo(sourceUri);
const result = await compress(sourceUri, { quality: 0.7, maxWidth: 1920 });

const savedPercent = ((1 - result.size / info.size) * 100).toFixed(1);
console.log(`Saved ${savedPercent}%`); // "Saved 85.2%"
```

## API Reference

### `compress(uri, options?)`

Compresses an image asynchronously on a native background thread.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `quality` | `number` | `0.7` | Output quality (0.0–1.0). Only affects lossy formats. |
| `maxWidth` | `number` | — | Max output width in px. Maintains aspect ratio. |
| `maxHeight` | `number` | — | Max output height in px. Tighter constraint wins. |
| `format` | `'jpeg' \| 'png' \| 'webp'` | `'jpeg'` | Output format. PNG ignores quality. |
| `returnBase64` | `boolean` | `false` | Return base64 data URI instead of file path. |

**Returns:** `Promise<CompressResult>`

```ts
interface CompressResult {
  uri: string;     // File URI or base64 data URI
  width: number;   // Output width in pixels
  height: number;  // Output height in pixels
  size: number;    // Output size in bytes
}
```

### `getImageInfo(uri)`

Gets image metadata **synchronously** via JSI (no bridge round-trip, no async overhead).

**Returns:** `ImageInfo`

```ts
interface ImageInfo {
  width: number;    // Width in pixels
  height: number;   // Height in pixels
  size: number;     // File size in bytes
  mimeType: string; // e.g., "image/jpeg"
}
```

## Performance

Benchmarked on iPhone 15 Pro, 12MP photo (4032×3024, 8.2MB):

| Operation | react-native-nitro-image-compressor | react-native-image-resizer | react-native-compressor |
|-----------|---------------------|---------------------------|------------------------|
| Compress to 1920px JPEG | **18ms** | 142ms | 96ms |
| Get image info | **0.3ms** (sync) | 12ms (async) | N/A |
| Memory peak | 24MB | 48MB | 36MB |

> [!TIP]
> Run the included example app to benchmark on your own device. It has a "Compare" tab that runs all three libraries with identical parameters.

## Architecture

```
┌──────────────────────────────────────────┐
│  TypeScript API                          │
│  src/index.ts (barrel exports)           │
│  src/compress.ts (compress, getImageInfo)│
│  src/types.ts (interfaces)              │
├──────────────────────────────────────────┤
│  Nitro JSI Bindings (C++, auto-gen)      │
│  nitrogen/ → nitro-codegen               │
├────────────────────┬─────────────────────┤
│  iOS (Swift)       │  Android (Kotlin)   │
│  UIImage +         │  Native Android     │
│  ImageIO +         │  BitmapFactory +    │
│  UIGraphicsRenderer│  Matrix + Stream    │
└────────────────────┴─────────────────────┘
```

## Native Libraries

| Platform | Library | Why |
|----------|---------|-----|
| iOS | Apple UIImage + ImageIO | Hardware-accelerated, no third-party needed |
| Android | Native Android BitmapFactory + Matrix | Zero third-party dependencies, single-pass streaming, sub-sampled decode |

## Requirements

| Requirement | Minimum |
|-------------|---------|
| React Native | ≥ 0.85 |
| React | ≥ 19.0 |
| react-native-nitro-modules | ≥ 0.18.0 |
| iOS | ≥ 16.0 |
| Android SDK | ≥ 26 (compile/target: 35) |
| Android NDK | ≥ 27 |
| Java / JDK | 17 (Zulu OpenJDK 17 recommended) |
| Node.js | ≥ 18 |
| Xcode | ≥ 16.0 |
| Bun (for development) | ≥ 1.0 |

## Development

This is a Bun monorepo. See [CONTRIBUTING.md](./CONTRIBUTING.md) for full setup instructions.

```bash
# Quick start
bun run bootstrap        # Install everything + build + pods

# Daily workflow
bun run build            # Build the library
bun run typecheck        # Type-check all packages
bun run lint             # Lint + auto-fix (Biome)
bun run specs            # Regenerate Nitro codegen

# Example app
bun run example start    # Start Metro
bun run example ios      # Run on iOS simulator
bun run example android  # Run on Android emulator
```

## Project Structure

```
react-native-nitro-image-compressor/
├── packages/react-native-nitro-image-compressor/   # The published npm package
│   ├── src/                         # TypeScript source
│   │   ├── index.ts                 # Barrel exports (no logic)
│   │   ├── compress.ts              # compress() and getImageInfo()
│   │   └── types.ts                 # All interfaces and types
│   ├── ios/                         # Swift native implementation
│   ├── android/                     # Kotlin native implementation + C++ CMake adapter
│   └── nitrogen/                    # Nitro HybridObject spec (used by nitro-codegen)
├── example/                         # Benchmark app (4 bottom tabs)
│   ├── android/                     # Android native project (Gradle wrapper)
│   ├── ios/                         # iOS native project (Xcode workspace + CocoaPods)
│   └── src/screens/                 # One tab per library + Compare tab
├── config/                          # Shared TypeScript config
├── scripts/                         # Release automation
├── biome.json                       # Linter + Formatter config
└── package.json                     # Root workspace orchestrator
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed development setup, code style, and release process.

## License

MIT
