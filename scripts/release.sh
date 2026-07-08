#!/bin/bash
set -e

echo "🚀 Releasing nitro-image-compress..."

# Ensure clean build
bun run clean
bun i
bun run build
bun run typecheck
bun run lint-ci

# Run release-it
bunx release-it "$@"

echo "✅ Release complete!"
