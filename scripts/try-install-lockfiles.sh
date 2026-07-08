#!/bin/bash
# Attempt to regenerate lockfiles after version bump.
# Non-fatal — CI will catch mismatches.

set -e

echo "📦 Regenerating lockfiles..."

if command -v bun &> /dev/null; then
  bun i
else
  echo "⚠️  bun not found, skipping lockfile regeneration"
fi
