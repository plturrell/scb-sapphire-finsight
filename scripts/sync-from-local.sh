#!/bin/bash
# Sync changes from local repository

set -e

echo "🔄 Syncing from local repository..."

# Check if local remote exists
if ! git remote get-url local >/dev/null 2>&1; then
    echo "❌ Local remote not configured. Run setup-local-repo.sh first."
    exit 1
fi

# Fetch from local
echo "📥 Fetching from local repository..."
git fetch local

# Show available branches
echo "📋 Available branches in local repository:"
git branch -r | grep "local/" | sed 's/local\///' | sed 's/^/  /'

echo "✅ Fetch from local repository completed"
echo "💡 To merge changes: git merge local/<branch-name>"
