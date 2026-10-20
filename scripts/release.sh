#!/bin/bash
#
# release.sh — Prepares, verifies, publishes to NPM, and creates/pushes Git tags.
# Called by GitHub Actions (.github/workflows/publish.yml) or executed locally.
#
# Usage:
#   ./scripts/release.sh            # Standard publish + Git tag & push
#   ./scripts/release.sh --dry-run  # Validates build and packaging without publishing or tagging
#

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG_DIR="$REPO_ROOT/packages/react-native-nitro-image-compressor"
README_TMP="$PKG_DIR/README.md"

DRY_RUN=false
for arg in "$@"; do
  if [ "$arg" = "--dry-run" ]; then
    DRY_RUN=true
  fi
done

echo "🔍 Running pre-publish verification..."
cd "$REPO_ROOT"
bun run lint-ci
bun run build
bun run typecheck

# Extract version from the package being published
VERSION=$(bun -e "console.log(require('$PKG_DIR/package.json').version)")
TAG="v$VERSION"

echo "📦 Preparing package for publication (version: $VERSION, tag: $TAG)..."
cp "$REPO_ROOT/README.md" "$README_TMP"
trap 'rm -f "$README_TMP"' EXIT

cd "$PKG_DIR"

EXTRA_FLAGS=""
if [ "$GITHUB_ACTIONS" = "true" ]; then
  EXTRA_FLAGS="--provenance"
fi

if [ "$DRY_RUN" = true ]; then
  echo "🧪 Running npm publish in dry-run mode..."
  npm publish --dry-run
  echo "🧪 [dry-run] Would create and push Git tag $TAG to GitHub"
else
  echo "🚀 Publishing react-native-nitro-image-compressor@$VERSION to NPM..."
  npm publish --access public $EXTRA_FLAGS

  echo "🧹 Cleaning temporary files..."
  rm -f "$README_TMP"
  trap - EXIT

  echo "🏷️ Creating Git tag $TAG..."
  cd "$REPO_ROOT"

  if [ "$GITHUB_ACTIONS" = "true" ]; then
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
  fi

  if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "⚠️ Git tag $TAG already exists locally. Updating tag pointer..."
    git tag -fa "$TAG" -m "Release $TAG"
  else
    git tag -a "$TAG" -m "Release $TAG"
  fi

  echo "📤 Pushing tag $TAG to GitHub (origin)..."
  git push origin "$TAG"

  # If GitHub CLI is available, also create/sync GitHub Release
  if command -v gh >/dev/null 2>&1; then
    echo "🐙 Creating GitHub Release for $TAG..."
    gh release create "$TAG" --title "$TAG" --generate-notes || true
  fi
fi

echo "✅ Release script completed successfully for $TAG!"

