#!/bin/bash
#
# prepare-release.sh — Prepares a Release PR:
# 1. Detects latest tag and calculates next semver version (patch, minor, or major)
# 2. Gathers commits since last tag
# 3. Creates dedicated release/v* branch
# 4. Updates versions in package.json files and refreshes lockfile
# 5. Pushes release branch and opens a Pull Request against main
#
set -e

BUMP_TYPE="${1:-patch}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# 1. Get latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.1.1")
CURRENT_VERSION="${LATEST_TAG#v}"

# 2. Compute next version based on BUMP_TYPE
IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
case "$BUMP_TYPE" in
  major)
    major=$((major + 1))
    minor=0
    patch=0
    ;;
  minor)
    minor=$((minor + 1))
    patch=0
    ;;
  patch|*)
    patch=$((patch + 1))
    ;;
esac
NEXT_VERSION="${major}.${minor}.${patch}"
RELEASE_BRANCH="release/v${NEXT_VERSION}"

echo "ℹ️ Latest tag: $LATEST_TAG"
echo "ℹ️ Next version ($BUMP_TYPE): v$NEXT_VERSION"
echo "ℹ️ Release branch: $RELEASE_BRANCH"

# 3. Check for commits since last tag
COMMITS=$(git log "${LATEST_TAG}..HEAD" --pretty=format:"- %s (%h)" --no-merges 2>/dev/null || true)
if [ -z "$COMMITS" ]; then
  COMMITS="- Maintenance and performance updates"
fi

# 4. Create and checkout release branch
git checkout -B "$RELEASE_BRANCH"

# 5. Update versions in package.json files
bun -e "
const fs = require('fs');
['package.json', 'packages/react-native-nitro-image-compressor/package.json', 'example/package.json'].forEach(f => {
  const p = JSON.parse(fs.readFileSync(f, 'utf8'));
  p.version = '$NEXT_VERSION';
  fs.writeFileSync(f, JSON.stringify(p, null, 2) + '\n');
});
"

# 6. Refresh lockfile
bun install --no-save

# 7. Commit changes
git add package.json packages/react-native-nitro-image-compressor/package.json example/package.json bun.lock
git commit -m "chore: prepare release v${NEXT_VERSION}"

# 8. Push release branch to origin
git push origin "$RELEASE_BRANCH" --force

# 9. Open Pull Request via GitHub CLI
PR_BODY="## 🚀 Release v${NEXT_VERSION}

This automated Release PR prepares the version bump for **\`react-native-nitro-image-compressor\`** to **\`v${NEXT_VERSION}\`**.

### 📋 Changes included since \`${LATEST_TAG}\`:
${COMMITS}

---
**Maintainer Instructions:**
1. Wait for CI checks (\`Lint, Typecheck & Build\`) to pass.
2. Merge this PR into \`main\` to automatically publish \`v${NEXT_VERSION}\` to NPM and create the GitHub Release.
"

gh pr create \
  --base main \
  --head "$RELEASE_BRANCH" \
  --title "Release v${NEXT_VERSION}" \
  --body "$PR_BODY" \
  || echo "PR already exists or created"

echo "✅ Release PR for v${NEXT_VERSION} created successfully on branch $RELEASE_BRANCH!"
