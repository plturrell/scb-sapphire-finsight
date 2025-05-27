#!/bin/bash

# Claude Git Hooks - Git hooks for Claude multi-instance workflow
# This script sets up Git hooks to enhance the Claude workflow

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[CLAUDE-HOOKS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Install pre-commit hook
install_pre_commit_hook() {
    local hook_file="$GIT_HOOKS_DIR/pre-commit"
    
    log "Installing pre-commit hook..."
    
    cat > "$hook_file" << 'EOF'
#!/bin/bash
# Claude Git Tree - Pre-commit hook

# Check if we're on a Claude branch
current_branch=$(git branch --show-current)

if [[ "$current_branch" == claude-work/* ]]; then
    echo "🤖 Claude instance detected: ${current_branch#claude-work/}"
    
    # Auto-stage Claude tracking file if it exists
    if [ -f ".claude-branches" ]; then
        git add .claude-branches
    fi
    
    # Check for large files
    git diff --cached --name-only | while read file; do
        if [ -f "$file" ] && [ $(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0) -gt 10485760 ]; then
            echo "⚠️  Warning: Large file detected: $file (>10MB)"
            echo "   Consider using Git LFS or excluding from commit"
        fi
    done
    
    # Validate package.json if modified
    if git diff --cached --name-only | grep -q "package.json"; then
        echo "📦 Validating package.json..."
        if ! node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"; then
            echo "❌ package.json is invalid JSON"
            exit 1
        fi
        echo "✅ package.json is valid"
    fi
    
    # Check for debugging code
    if git diff --cached --name-only | grep -E '\.(js|jsx|ts|tsx)$' | xargs grep -l "console\.log\|debugger\|TODO\|FIXME" 2>/dev/null; then
        echo "⚠️  Warning: Found debugging code or TODOs in staged files"
        echo "   Consider removing before commit"
    fi
fi

exit 0
EOF

    chmod +x "$hook_file"
    success "Pre-commit hook installed"
}

# Install post-commit hook
install_post_commit_hook() {
    local hook_file="$GIT_HOOKS_DIR/post-commit"
    
    log "Installing post-commit hook..."
    
    cat > "$hook_file" << 'EOF'
#!/bin/bash
# Claude Git Tree - Post-commit hook

current_branch=$(git branch --show-current)

if [[ "$current_branch" == claude-work/* ]]; then
    claude_id="${current_branch#claude-work/}"
    commit_hash=$(git rev-parse HEAD)
    commit_msg=$(git log -1 --pretty=%B)
    
    echo "🎉 Claude commit successful!"
    echo "   Instance: $claude_id"
    echo "   Commit: $commit_hash"
    echo "   Message: $commit_msg"
    
    # Update tracking file with latest activity
    if [ -f ".claude-branches" ]; then
        # Update timestamp for this Claude instance
        temp_file=$(mktemp)
        while IFS=: read -r id branch timestamp; do
            if [ "$id" = "$claude_id" ]; then
                echo "$id:$branch:$(date -Iseconds)" >> "$temp_file"
            else
                echo "$id:$branch:$timestamp" >> "$temp_file"
            fi
        done < ".claude-branches"
        mv "$temp_file" ".claude-branches"
    fi
fi
EOF

    chmod +x "$hook_file"
    success "Post-commit hook installed"
}

# Install branch protection hook
install_pre_push_hook() {
    local hook_file="$GIT_HOOKS_DIR/pre-push"
    
    log "Installing pre-push hook..."
    
    cat > "$hook_file" << 'EOF'
#!/bin/bash
# Claude Git Tree - Pre-push hook

current_branch=$(git branch --show-current)

# Prevent direct push to main from Claude branches
if [[ "$current_branch" == claude-work/* ]]; then
    echo "❌ Direct push from Claude branch not allowed"
    echo "   Use: npm run claude:merge <claude-id>"
    echo "   Or: ./scripts/claude-git-manager.sh merge <claude-id>"
    exit 1
fi

# Warn about pushing to main
if [[ "$current_branch" == "main" ]]; then
    echo "⚠️  Pushing to main branch"
    read -p "Are you sure? This should typically be done via Claude merge. Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Push cancelled"
        exit 1
    fi
fi
EOF

    chmod +x "$hook_file"
    success "Pre-push hook installed"
}

# Install all hooks
install_all_hooks() {
    if [ ! -d "$GIT_HOOKS_DIR" ]; then
        echo "❌ Not a Git repository or hooks directory missing"
        exit 1
    fi
    
    log "Installing Claude Git hooks..."
    
    install_pre_commit_hook
    install_post_commit_hook
    install_pre_push_hook
    
    success "All Claude Git hooks installed successfully!"
    echo ""
    echo "The following hooks are now active:"
    echo "  • pre-commit: Validates Claude branches and files"
    echo "  • post-commit: Tracks Claude activity"
    echo "  • pre-push: Prevents direct pushes from Claude branches"
}

# Uninstall hooks
uninstall_hooks() {
    log "Uninstalling Claude Git hooks..."
    
    for hook in pre-commit post-commit pre-push; do
        hook_file="$GIT_HOOKS_DIR/$hook"
        if [ -f "$hook_file" ] && grep -q "Claude Git Tree" "$hook_file"; then
            rm "$hook_file"
            success "Removed $hook hook"
        fi
    done
    
    success "Claude Git hooks uninstalled"
}

# Show hook status
show_status() {
    log "Claude Git hooks status:"
    
    for hook in pre-commit post-commit pre-push; do
        hook_file="$GIT_HOOKS_DIR/$hook"
        if [ -f "$hook_file" ] && grep -q "Claude Git Tree" "$hook_file"; then
            echo "  ✅ $hook: Installed"
        else
            echo "  ❌ $hook: Not installed"
        fi
    done
}

# Main command dispatcher
case "${1:-install}" in
    "install")
        install_all_hooks
        ;;
    "uninstall")
        uninstall_hooks
        ;;
    "status")
        show_status
        ;;
    "help"|"--help"|"-h")
        echo "Claude Git Hooks - Git hooks for Claude multi-instance workflow"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  install     Install all Claude Git hooks (default)"
        echo "  uninstall   Remove Claude Git hooks"
        echo "  status      Show hook installation status"
        echo "  help        Show this help message"
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac