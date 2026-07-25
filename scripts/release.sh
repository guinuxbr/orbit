#!/usr/bin/env bash
set -euo pipefail

VERSION=""
MESSAGE=""
TYPE="feat"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -v|--version)
      VERSION="$2"
      shift 2
      ;;
    -m|--message|-s|--summary)
      MESSAGE="$2"
      shift 2
      ;;
    -t|--type)
      TYPE="$2"
      shift 2
      ;;
    *)
      if [ -z "$VERSION" ]; then
        VERSION="$1"
      elif [ -z "$MESSAGE" ]; then
        MESSAGE="$1"
      fi
      shift
      ;;
  esac
done

if [ -z "$VERSION" ]; then
  echo "❌ Error: Version argument is required."
  echo "Usage: mise run release 1.5.0 [-m \"Release details\"]"
  echo "   or: ./scripts/release.sh 1.5.0 -m \"Release details\""
  exit 1
fi

echo "📦 Bumping version to ${VERSION}..."
npm version "$VERSION" --no-git-tag-version

echo "🧪 Running test suite..."
npm run test

if command -v rumdl &> /dev/null; then
  echo "✨ Formatting with rumdl..."
  rumdl fmt || true
fi

echo "📝 Creating Conventional Commit..."
git add .

COMMIT_HEADER="${TYPE}(release): release v${VERSION}"

if [ -n "$MESSAGE" ]; then
  git commit -m "$COMMIT_HEADER" -m "$MESSAGE"
else
  git commit -m "$COMMIT_HEADER"
fi

echo "🚀 Pushing branch to origin..."
git push origin HEAD

NEW_VER=$(node -p "require('./package.json').version")
echo ""
echo "✅ Release v${NEW_VER} committed and pushed successfully!"
echo "🎉 Next step: Open a PR into main to publish."
