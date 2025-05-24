#!/bin/bash

# Setup Local Repository - Create local Git repository for offline work
# This script sets up a local bare repository that can be used for offline development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_NAME="scb-sapphire-finsight"

# Default local repository path
DEFAULT_LOCAL_REPO_PATH="$HOME/git-repos-local"
LOCAL_REPO_PATH="${LOCAL_REPO_PATH:-$DEFAULT_LOCAL_REPO_PATH}"
LOCAL_REPO_NAME="$PROJECT_NAME-local.git"
FULL_LOCAL_REPO_PATH="$LOCAL_REPO_PATH/$LOCAL_REPO_NAME"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[LOCAL-REPO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Create local bare repository
create_local_repo() {
    log "Creating local repository at: $FULL_LOCAL_REPO_PATH"
    
    # Create directory if it doesn't exist
    mkdir -p "$LOCAL_REPO_PATH"
    
    # Create bare repository
    if [ -d "$FULL_LOCAL_REPO_PATH" ]; then
        warn "Local repository already exists at $FULL_LOCAL_REPO_PATH"
        read -p "Do you want to recreate it? This will delete existing data! (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$FULL_LOCAL_REPO_PATH"
        else
            log "Using existing repository"
            return 0
        fi
    fi
    
    # Initialize bare repository
    git init --bare "$FULL_LOCAL_REPO_PATH"
    success "Local bare repository created at: $FULL_LOCAL_REPO_PATH"
}

# Add local remote to current repository
add_local_remote() {
    log "Adding local remote to current repository..."
    
    cd "$PROJECT_ROOT"
    
    # Remove existing local remote if it exists
    if git remote get-url local >/dev/null 2>&1; then
        log "Removing existing local remote"
        git remote remove local
    fi
    
    # Add local remote
    git remote add local "file://$FULL_LOCAL_REPO_PATH"
    success "Added local remote: file://$FULL_LOCAL_REPO_PATH"
    
    # Show remotes
    log "Current remotes:"
    git remote -v
}

# Initial sync to local repository
initial_sync() {
    log "Performing initial sync to local repository..."
    
    cd "$PROJECT_ROOT"
    
    # Push all branches to local
    log "Pushing all branches to local repository..."
    git push local --all
    
    # Push all tags
    log "Pushing all tags to local repository..."
    git push local --tags
    
    success "Initial sync completed"
}

# Create sync scripts
create_sync_scripts() {
    log "Creating sync scripts..."
    
    # Create push to local script
    cat > "$PROJECT_ROOT/scripts/sync-to-local.sh" << EOF
#!/bin/bash
# Sync changes to local repository

set -e

LOCAL_REPO_PATH="$FULL_LOCAL_REPO_PATH"

echo "🔄 Syncing to local repository..."

# Check if local remote exists
if ! git remote get-url local >/dev/null 2>&1; then
    echo "❌ Local remote not configured. Run setup-local-repo.sh first."
    exit 1
fi

# Get current branch
CURRENT_BRANCH=\$(git branch --show-current)

# Push current branch
echo "📤 Pushing \$CURRENT_BRANCH to local..."
git push local "\$CURRENT_BRANCH"

# Push all Claude branches
echo "🤖 Syncing Claude branches..."
git push local 'refs/heads/claude-work/*:refs/heads/claude-work/*' 2>/dev/null || echo "No Claude branches to sync"

# Push tags
echo "🏷️  Syncing tags..."
git push local --tags

echo "✅ Sync to local repository completed"
echo "📍 Local repo: \$LOCAL_REPO_PATH"
EOF

    chmod +x "$PROJECT_ROOT/scripts/sync-to-local.sh"
    
    # Create pull from local script
    cat > "$PROJECT_ROOT/scripts/sync-from-local.sh" << EOF
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
EOF

    chmod +x "$PROJECT_ROOT/scripts/sync-from-local.sh"
    
    # Create offline status script
    cat > "$PROJECT_ROOT/scripts/offline-status.sh" << EOF
#!/bin/bash
# Show offline work status

set -e

echo "🛩️  Offline Git Status"
echo "===================="

# Current branch and status
echo "📍 Current branch: \$(git branch --show-current)"
echo "📊 Working directory status:"
git status --porcelain | head -10

# Local commits not in origin
echo ""
echo "📤 Local commits (not in origin):"
CURRENT_BRANCH=\$(git branch --show-current)
git log --oneline origin/\$CURRENT_BRANCH..\$CURRENT_BRANCH 2>/dev/null || echo "  No connection to origin or no local commits"

# Local repository status
if git remote get-url local >/dev/null 2>&1; then
    echo ""
    echo "💾 Local repository status:"
    echo "   Location: \$(git remote get-url local)"
    echo "   Last sync: \$(git log -1 --format="%ci" local/\$CURRENT_BRANCH 2>/dev/null || echo "Never synced")"
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
EOF

    chmod +x "$PROJECT_ROOT/scripts/offline-status.sh"
    
    success "Sync scripts created:"
    echo "  • sync-to-local.sh - Push changes to local repo"
    echo "  • sync-from-local.sh - Pull changes from local repo"
    echo "  • offline-status.sh - Show offline work status"
}

# Update package.json with offline scripts
update_package_scripts() {
    log "Updating package.json with offline scripts..."
    
    cd "$PROJECT_ROOT"
    
    # Check if jq is available
    if command -v jq >/dev/null 2>&1; then
        # Use jq to update package.json
        jq '.scripts["sync:local"] = "./scripts/sync-to-local.sh"' package.json > package.json.tmp && mv package.json.tmp package.json
        jq '.scripts["sync:from-local"] = "./scripts/sync-from-local.sh"' package.json > package.json.tmp && mv package.json.tmp package.json
        jq '.scripts["offline:status"] = "./scripts/offline-status.sh"' package.json > package.json.tmp && mv package.json.tmp package.json
        success "Updated package.json with offline scripts"
    else
        warn "jq not available. Please manually add these scripts to package.json:"
        echo '  "sync:local": "./scripts/sync-to-local.sh",'
        echo '  "sync:from-local": "./scripts/sync-from-local.sh",'
        echo '  "offline:status": "./scripts/offline-status.sh"'
    fi
}

# Show setup summary
show_summary() {
    echo ""
    echo "🎉 Local Repository Setup Complete!"
    echo "=================================="
    echo ""
    echo "📍 Local Repository: $FULL_LOCAL_REPO_PATH"
    echo "🔗 Remote name: local"
    echo ""
    echo "🛩️  Offline Workflow Commands:"
    echo "   npm run sync:local      # Push to local repo"
    echo "   npm run sync:from-local # Pull from local repo"
    echo "   npm run offline:status  # Show offline status"
    echo ""
    echo "🤖 Claude + Offline Workflow:"
    echo "   npm run claude:new      # Create new Claude branch"
    echo "   # Work on your changes"
    echo "   git commit -m 'Your changes'"
    echo "   npm run sync:local      # Sync to local repo"
    echo ""
    echo "✈️  Before Flying:"
    echo "   1. Run: npm run sync:local"
    echo "   2. Ensure all changes are committed"
    echo "   3. Create any needed Claude branches"
    echo ""
    echo "🛬 After Landing:"
    echo "   1. Connect to internet"
    echo "   2. Run: git fetch origin"
    echo "   3. Merge any remote changes"
    echo "   4. Push your work: git push origin <branch>"
}

# Main setup function
setup_local_repo() {
    log "Setting up local Git repository for offline work..."
    
    # Check if we're in a Git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        error "Not in a Git repository"
        exit 1
    fi
    
    create_local_repo
    add_local_remote
    initial_sync
    create_sync_scripts
    update_package_scripts
    show_summary
}

# Command dispatcher
case "${1:-setup}" in
    "setup")
        if [ -n "$2" ]; then
            LOCAL_REPO_PATH="$2"
            FULL_LOCAL_REPO_PATH="$LOCAL_REPO_PATH/$LOCAL_REPO_NAME"
        fi
        setup_local_repo
        ;;
    "info")
        echo "Local Repository Information:"
        echo "  Default path: $DEFAULT_LOCAL_REPO_PATH"
        echo "  Repository name: $LOCAL_REPO_NAME"
        echo "  Full path: $FULL_LOCAL_REPO_PATH"
        echo ""
        echo "Usage: $0 [setup] [custom-path]"
        echo "Example: $0 setup /Users/yourname/offline-repos"
        ;;
    "help"|"--help"|"-h")
        echo "Setup Local Repository - Create local Git repository for offline work"
        echo ""
        echo "Usage: $0 <command> [path]"
        echo ""
        echo "Commands:"
        echo "  setup [path]    Set up local repository (default: $DEFAULT_LOCAL_REPO_PATH)"
        echo "  info            Show repository information"
        echo "  help            Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 setup                           # Use default path"
        echo "  $0 setup /path/to/offline-repos    # Use custom path"
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac