#!/bin/bash
#
# release.sh — Bumps versions, updates changelog, tags, and creates a GitHub release.
#
# The created GitHub Release automatically triggers the GitHub Actions workflow
# (.github/workflows/publish.yml), which builds and publishes the package to NPM
# with cryptographic build provenance.
#
# Usage:
#   bun run release             # Interactive (prompts for patch / minor / major)
#   bun run release -- patch    # Auto patch bump (0.1.0 → 0.1.1)
#   bun run release -- minor    # Auto minor bump (0.1.0 → 0.2.0)
#   bun run release -- major    # Auto major bump (0.1.0 → 1.0.0)
#
# Prerequisites:
#   - Clean git working directory
#   - Push access to origin
#   - GITHUB_TOKEN (optional, or gh auth login for GitHub CLI / release creation)

set -e

echo "🔍 Running pre-release checks..."
bun run lint-ci
bun run typecheck
bun run build

echo "🚀 Starting release process..."
echo "Provided options: $@"

# Run release-it from repository root:
# 1. Prompts for version bump
# 2. Bumps package.json in packages/ and example/
# 3. Regenerates lockfiles via scripts/try-install-lockfiles.sh
# 4. Generates conventional changelog
# 5. Creates git commit and tag
# 6. Pushes to origin and creates GitHub Release
bun run release-it "$@"

echo ""
echo "🎉 Release successfully tagged and pushed to GitHub!"
echo "📡 GitHub Actions is now publishing to NPM with provenance."
echo "👉 Track progress in your repo's Actions tab: https://github.com/ryuankurotaku/nitro-image-compress/actions"
