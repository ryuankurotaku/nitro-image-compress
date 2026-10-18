#!/bin/bash
#
# release.sh — Prepares, verifies, and publishes react-native-nitro-image-compressor to NPM.
# Called by GitHub Actions (.github/workflows/publish.yml) or executed locally.
#
# Usage:
#   ./scripts/release.sh            # Standard publish (includes provenance in CI)
#   ./scripts/release.sh --dry-run  # Validates build and packaging without publishing
#

set -e

DRY_RUN=false
for arg in "$@"; do
  if [ "$arg" = "--dry-run" ]; then
    DRY_RUN=true
  fi
done

echo "🔍 Running pre-publish verification..."
bun run lint-ci
bun run build
bun run typecheck

echo "📦 Preparing package for publication..."
cd packages/react-native-nitro-image-compressor
cp ../../README.md README.md

# Ensure temporary README copy is always cleaned up on script exit
trap 'rm -f README.md' EXIT

EXTRA_FLAGS=""
if [ "$GITHUB_ACTIONS" = "true" ]; then
  EXTRA_FLAGS="--provenance"
fi

if [ "$DRY_RUN" = true ]; then
  echo "🧪 Running npm publish in dry-run mode..."
  npm publish --dry-run
else
  echo "🚀 Publishing react-native-nitro-image-compressor to NPM..."
  npm publish --access public $EXTRA_FLAGS
fi

echo "✅ Release script completed successfully!"
