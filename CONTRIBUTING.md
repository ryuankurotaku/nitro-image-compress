# Contributing to react-native-nitro-image-compressor

## Project Structure

```
react-native-nitro-image-compressor/
├── packages/
│   └── react-native-nitro-image-compressor/       # The npm-published library
│       ├── src/                     # TypeScript source (barrel → compress → types)
│       ├── ios/                     # Swift native implementation (UIImage + ImageIO)
│       ├── android/                 # Kotlin native implementation + C++ JNI adapter
│       │   ├── CMakeLists.txt       # CMake build for libNitroImageCompress.so
│       │   └── src/main/
│       │       ├── cpp/             # JNI entry point (cpp-adapter.cpp)
│       │       └── java/com/margelo/nitro/imagecompress/
│       │           └── HybridImageCompressor.kt  # Kotlin implementation
│       ├── nitrogen/                # Nitro HybridObject spec (used by nitro-codegen)
│       ├── tsconfig.json            # Typecheck config (noEmit)
│       └── tsconfig.build.json      # Build config (emits to lib/ via bob)
├── example/                         # React Native benchmark app
│   ├── android/                     # Android native project (Gradle wrapper)
│   ├── ios/                         # iOS native project (Xcode workspace + CocoaPods)
│   └── src/
│       ├── screens/                 # One tab per library for independent testing
│       ├── components/              # Shared UI (charts, cards)
│       └── utils/                   # Benchmark runner (times all 3 libraries)
├── config/
│   └── tsconfig.json                # Shared base TypeScript config (extended by all packages)
├── scripts/
│   ├── prepare-release.sh           # Automated Release PR creation (version bump + notes)
│   └── release.sh                   # NPM publish + GitHub release automation
├── biome.json                       # Linter + formatter (replaces ESLint + Prettier)
└── package.json                     # Root workspace orchestrator
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (≥ 1.0, package manager + task runner)
- [Node.js](https://nodejs.org) (≥ 18) — required for Metro bundler and React Native CLI
- [Java / JDK 17](https://www.azul.com/downloads/?version=java-17-lts&package=jdk) (Zulu OpenJDK 17 recommended for React Native 0.85 & Gradle)
- Android Studio + Android SDK (API 35, Build-Tools 35.0.0+, NDK 27+)
- Xcode 16+ (iOS 16+ deployment target)
- Ruby (≥ 2.6) + Bundler & CocoaPods

### Environment Setup (macOS)

Ensure your shell exports the required SDK and JDK paths:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$HOME/.bun/bin:$PATH
```

### Bootstrap

```bash
# One command sets up everything: install deps → build lib → install pods
bun run bootstrap
```

### Development Workflow

```bash
# Type-check all packages
bun run typecheck

# Lint + auto-fix with Biome
bun run lint

# Build the library (outputs to packages/react-native-nitro-image-compressor/lib/)
bun run build

# Run Nitro codegen (generates C++, Swift, and Kotlin specs + autolinking)
bun run specs

# Start the example app Metro bundler
bun run example start

# Run on iOS simulator
bun run example ios

# Run on Android emulator/device
bun run example android

# Alternatively, direct native builds:
cd example/ios && pod install
xcodebuild -workspace example/ios/NitroImageCompressExample.xcworkspace -scheme NitroImageCompressExample -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build

cd example/android && ./gradlew assembleDebug
```

## Key Concepts

### Nitro Modules Architecture

```
TypeScript API  →  JSI Bindings (C++, auto-generated)  →  Native (Swift/Kotlin)
     ↑                        ↑                                    ↑
  src/index.ts        nitrogen/generated/            ios/ & android/
  (what users import)  (gitignored, auto-generated)   (hand-written native code)
```

- **`src/specs/ImageCompressor.nitro.ts`** defines the HybridObject interface.
- **`nitro.json`** configures autolinking for Swift and Kotlin:
  ```json
  "autolinking": {
    "ImageCompressor": {
      "swift": "HybridImageCompressor",
      "kotlin": "HybridImageCompressor"
    }
  }
  ```
- Running `bun run specs` executes `nitro-codegen` and outputs:
  - iOS autolinking: `NitroImageCompressAutolinking.mm` (Objective-C `+load`) & `NitroImageCompressAutolinking.swift`
  - Android autolinking: `NitroImageCompressOnLoad.cpp/hpp` (invoked via `JNI_OnLoad` in `cpp-adapter.cpp`)
  - C++ JSI bindings into `nitrogen/generated/` (configured in `.gitignore`).
- Native code in `ios/` and `android/` implements the generated spec.

### TypeScript Config Hierarchy

```
config/tsconfig.json                  ← Shared strict base (composite, ESNext, strict)
├── packages/*/tsconfig.json          ← Typecheck only (noEmit: true, composite: false)
├── packages/*/tsconfig.build.json    ← Build output (jsx: react, used by bob)
└── example/tsconfig.json             ← Typecheck only (noEmit: true, composite: false)
```

Both `tsconfig.json` and `tsconfig.build.json` extend:
1. `@tsconfig/react-native/tsconfig.json` — React Native defaults
2. `../../config/tsconfig.json` — Our shared strict settings

### Release Process

Releases follow an automated **Release PR** workflow:

1. In GitHub Actions, navigate to **Prepare Release PR** and click **Run workflow** (select `patch`, `minor`, or `major`).
2. The workflow runs `scripts/prepare-release.sh`, creates a branch `release/v<version>`, updates package manifests, and opens a Pull Request with commit notes.
3. Once CI (`Lint, Typecheck & Build`) passes, merge the Pull Request into `main`.
4. Merging automatically triggers **Publish Release to NPM**, which builds, publishes to NPM with OIDC provenance, and creates the GitHub release and tag.

### Adding a New Compression Format

1. Add the format to `ImageFormat` type in `src/types.ts`
2. Handle it in `compress.ts` default options
3. Add the native encoding in:
   - `ios/NitroImageCompress/HybridImageCompressor.swift` → `compressImage()`
   - `android/src/main/java/com/margelo/nitro/imagecompress/HybridImageCompressor.kt` → `compressFormat` when-block
4. Add MIME detection in both native `detectMimeType` methods

## Code Style

- **Biome** handles all formatting and linting (no ESLint/Prettier)
- Run `bun run lint` before committing
- Semicolons: always
- Quotes: single
- Trailing commas: all
- Use `import type` for type-only imports (enforced by Biome)

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add HEIF format support
fix: correct EXIF rotation on Android
perf: use inSampleSize for memory-efficient decode
docs: update API examples in README
chore(deps): bump react-native-nitro-modules to 0.18.1
```

These are automatically formatted into release notes in the Release PR.
