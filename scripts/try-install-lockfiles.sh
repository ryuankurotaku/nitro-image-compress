#!/bin/bash
#
# try-install-lockfiles.sh — Regenerates JS lockfile and builds after a version bump.
#
# Called by release-it's `after:bump` hook.
#

set -e

cd "$(pwd)"

# 1. Reinstall JS dependencies to update bun.lock with new version
bun i

# 2. Ensure fresh build artifacts
bun run build

# 3. Stage updated bun.lock for the release commit
git add bun.lock 2>/dev/null || true
