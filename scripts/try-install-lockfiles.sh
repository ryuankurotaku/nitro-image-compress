#!/bin/bash
#
# try-install-lockfiles.sh — Regenerates lockfiles after a version bump.
#
# Called by release-it's `after:bump` hook. This script is intentionally
# non-fatal (set +e) because lockfile regeneration should never block a release.
#
# What it does:
# 1. Reinstalls JS dependencies (updates bun.lock with new version)
# 2. Rebuilds the library (ensures lib/ is fresh)
# 3. Installs Ruby gems for CocoaPods (example app)
# 4. Runs `pod install` to update Podfile.lock
# 5. Stages all lockfile changes for the release commit

# Do not exit on errors
set +e

cd "$(pwd)" || exit 0

# Run commands and ignore any errors
{
  # Install JS lockfiles
  bun i
  bun run build

  # Install example pods
  bun example bundle-install
  bun example pods

  # Add everything to git
  git add **/*.lock
} || true

# No errors - whatever.
exit 0
