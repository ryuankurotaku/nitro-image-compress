#!/bin/bash

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
