#!/bin/bash
#
# release.sh — Publishes the library to NPM and creates a GitHub release.
#
# Flow:
# 1. Publishes `nitro-image-compress` to NPM (copies root README for npm page)
# 2. Creates a git bump commit, tag, and GitHub release via release-it
#
# Usage:
#   bun run release             # Interactive (prompts for version bump type)
#   bun run release -- patch    # Non-interactive patch bump (0.1.0 → 0.1.1)
#   bun run release -- minor    # Non-interactive minor bump (0.1.0 → 0.2.0)
#   bun run release -- major    # Non-interactive major bump (0.1.0 → 1.0.0)
#
# Prerequisites:
#   - NPM_TOKEN environment variable set (or `npm login` completed)
#   - GITHUB_TOKEN for GitHub release creation
#   - Clean working directory recommended (but not enforced)

set -e

echo "Starting the release process..."
echo "Provided options: $@"

echo "Publishing 'nitro-image-compress' to NPM"
cd packages/nitro-image-compress
cp ../../README.md README.md
bun release $@
rm README.md

echo "Creating a Git bump commit and GitHub release"
cd ../..
bun run release-it $@

echo "Successfully released nitro-image-compress!"
