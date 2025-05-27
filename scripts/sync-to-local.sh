#!/bin/bash
# Sync changes to local repository

set -e

LOCAL_REPO_PATH="/Users/apple/git-repos-local/scb-sapphire-finsight-local.git"

echo "🔄 Syncing to local repository..."

# Check if local remote exists
if ! git remote get-url local >/dev/null 2>&1; then
    echo "❌ Local remote not configured. Run setup-local-repo.sh first."
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Push current branch
echo "📤 Pushing $CURRENT_BRANCH to local..."
git push local "$CURRENT_BRANCH"

# Push all Claude branches
echo "🤖 Syncing Claude branches..."
git push local 'refs/heads/claude-work/*:refs/heads/claude-work/*' 2>/dev/null || echo "No Claude branches to sync"

# Push tags
echo "🏷️  Syncing tags..."
git push local --tags

echo "✅ Sync to local repository completed"
echo "📍 Local repo: $LOCAL_REPO_PATH"
