# Contributing to nitro-image-compress

## Project Structure

```
nitro-image-compress/
├── packages/
│   └── nitro-image-compress/       # The npm-published library
│       ├── src/                     # TypeScript source (barrel → compress → types)
│       ├── ios/                     # Swift native implementation (UIImage + ImageIO)
│       ├── android/                 # Kotlin native implementation (id.zelory:compressor)
│       ├── nitrogen/                # Nitro HybridObject spec (used by nitro-codegen)
│       ├── tsconfig.json            # Typecheck config (noEmit)
│       └── tsconfig.build.json      # Build config (emits to lib/ via bob)
├── example/                         # React Native benchmark app
│   └── src/
│       ├── screens/                 # One tab per library for independent testing
│       ├── components/              # Shared UI (charts, cards)
│       └── utils/                   # Benchmark runner (times all 3 libraries)
├── config/
│   └── tsconfig.json                # Shared base TypeScript config (extended by all packages)
├── scripts/
│   ├── release.sh                   # NPM publish + GitHub release automation
│   └── try-install-lockfiles.sh     # Post-bump lockfile regeneration (non-fatal)
├── biome.json                       # Linter + formatter (replaces ESLint + Prettier)
└── package.json                     # Root workspace orchestrator
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (package manager + task runner)
- Xcode 15+ (for iOS)
- Android Studio + SDK 26+ (for Android)
- Ruby + Bundler (for CocoaPods)

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

# Build the library (outputs to packages/nitro-image-compress/lib/)
bun run build

# Run Nitro codegen (generates C++ JSI bindings from nitrogen/ spec)
bun run specs

# Start the example app
bun example start
bun example ios
bun example android
```

## Key Concepts

### Nitro Modules Architecture

```
TypeScript API  →  JSI Bindings (C++, auto-generated)  →  Native (Swift/Kotlin)
     ↑                        ↑                                    ↑
  src/index.ts        nitrogen/generated/            ios/ & android/
  (what users import)  (don't edit manually)         (hand-written native code)
```

- **`nitrogen/image-compress.nitro.ts`** defines the HybridObject interface
- Running `bun run specs` generates C++ bindings into `nitrogen/generated/`
- Native code in `ios/` and `android/` implements the generated spec

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

```bash
bun run release          # Interactive — prompts for patch/minor/major
bun run release -- patch # Auto patch bump
```

The release flow:
1. `scripts/release.sh` is invoked
2. Copies root `README.md` into the package (for npm page)
3. Runs `release-it` inside the package (typecheck → build → npm publish)
4. Cleans up the copied README
5. Runs root `release-it` (git commit → tag → GitHub release → changelog)

### Adding a New Compression Format

1. Add the format to `ImageFormat` type in `src/types.ts`
2. Handle it in `compress.ts` default options
3. Add the native encoding in:
   - `ios/NitroImageCompress/HybridImageCompressor.swift` → `compressImage()`
   - `android/.../HybridImageCompressor.kt` → `compressFormat` when-block
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
chore(deps): bump id.zelory:compressor to 3.1.0
```

These map to changelog sections automatically via `@release-it/conventional-changelog`.
