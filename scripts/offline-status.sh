#!/bin/bash
# Show offline work status

set -e

echo "🛩️  Offline Git Status"
echo "===================="

# Current branch and status
echo "📍 Current branch: $(git branch --show-current)"
echo "📊 Working directory status:"
git status --porcelain | head -10

# Local commits not in origin
echo ""
echo "📤 Local commits (not in origin):"
CURRENT_BRANCH=$(git branch --show-current)
git log --oneline origin/$CURRENT_BRANCH..$CURRENT_BRANCH 2>/dev/null || echo "  No connection to origin or no local commits"

# Local repository status
if git remote get-url local >/dev/null 2>&1; then
    echo ""
    echo "💾 Local repository status:"
    echo "   Location: $(git remote get-url local)"
    echo "   Last sync: $(git log -1 --format="%ci" local/$CURRENT_BRANCH 2>/dev/null || echo "Never synced")"
else
    echo ""
    echo "❌ No local repository configured"
    echo "   Run: ./scripts/setup-local-repo.sh"
fi

# Claude branches
echo ""
echo "🤖 Claude branches:"
git branch --list "claude-work/*" | sed 's/^../  /' || echo "  No Claude branches"

echo ""
echo "💡 Offline commands:"
echo "   Sync to local:   ./scripts/sync-to-local.sh"
echo "   Sync from local: ./scripts/sync-from-local.sh"
echo "   Create Claude:   npm run claude:new"
