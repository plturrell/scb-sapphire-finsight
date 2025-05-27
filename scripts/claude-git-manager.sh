#!/bin/bash

# Claude Git Manager - Multi-instance branching system
# This script manages Git branches for multiple Claude instances working simultaneously

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CLAUDE_BRANCHES_FILE="$PROJECT_ROOT/.claude-branches"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[CLAUDE-GIT]${NC} $1"
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

# Generate unique Claude instance ID
generate_claude_id() {
    echo "claude-$(date +%Y%m%d-%H%M%S)-$(openssl rand -hex 4)"
}

# Get current Claude instance ID from environment or generate new one
get_claude_id() {
    if [ -n "$CLAUDE_INSTANCE_ID" ]; then
        echo "$CLAUDE_INSTANCE_ID"
    else
        generate_claude_id
    fi
}

# Create a new branch for Claude instance
create_claude_branch() {
    local claude_id="$1"
    local base_branch="${2:-main}"
    local branch_name="claude-work/$claude_id"
    
    log "Creating branch $branch_name from $base_branch"
    
    # Ensure we're on the base branch and it's up to date
    git checkout "$base_branch"
    git pull origin "$base_branch" 2>/dev/null || warn "Could not pull from origin/$base_branch"
    
    # Create and checkout the new branch
    git checkout -b "$branch_name"
    
    # Record the branch in our tracking file
    echo "$claude_id:$branch_name:$(date -Iseconds)" >> "$CLAUDE_BRANCHES_FILE"
    
    success "Created and switched to branch: $branch_name"
    echo "CLAUDE_INSTANCE_ID=$claude_id"
}

# Switch to Claude instance branch
switch_claude_branch() {
    local claude_id="$1"
    local branch_name="claude-work/$claude_id"
    
    if git show-ref --verify --quiet "refs/heads/$branch_name"; then
        git checkout "$branch_name"
        success "Switched to branch: $branch_name"
    else
        error "Branch $branch_name does not exist"
        return 1
    fi
}

# List all Claude branches
list_claude_branches() {
    log "Active Claude branches:"
    git branch --list "claude-work/*" | sed 's/^..//' | while read -r branch; do
        if [ -n "$branch" ]; then
            local last_commit=$(git log -1 --format="%h %s" "$branch" 2>/dev/null || echo "No commits")
            echo "  $branch - $last_commit"
        fi
    done
    
    if [ -f "$CLAUDE_BRANCHES_FILE" ]; then
        log "Tracked instances:"
        cat "$CLAUDE_BRANCHES_FILE" | while IFS=: read -r claude_id branch_name timestamp; do
            echo "  $claude_id -> $branch_name (created: $timestamp)"
        done
    fi
}

# Clean up old Claude branches
cleanup_claude_branches() {
    local days_old="${1:-7}"
    
    log "Cleaning up Claude branches older than $days_old days..."
    
    git branch --list "claude-work/*" | sed 's/^..//' | while read -r branch; do
        if [ -n "$branch" ]; then
            local last_commit_date=$(git log -1 --format="%ct" "$branch" 2>/dev/null || echo "0")
            local current_date=$(date +%s)
            local age_days=$(( (current_date - last_commit_date) / 86400 ))
            
            if [ "$age_days" -gt "$days_old" ]; then
                warn "Deleting old branch: $branch (${age_days} days old)"
                git branch -D "$branch" 2>/dev/null || true
            fi
        fi
    done
    
    # Clean up tracking file
    if [ -f "$CLAUDE_BRANCHES_FILE" ]; then
        cp "$CLAUDE_BRANCHES_FILE" "$CLAUDE_BRANCHES_FILE.bak"
        > "$CLAUDE_BRANCHES_FILE"
        
        while IFS=: read -r claude_id branch_name timestamp; do
            if git show-ref --verify --quiet "refs/heads/$branch_name"; then
                echo "$claude_id:$branch_name:$timestamp" >> "$CLAUDE_BRANCHES_FILE"
            fi
        done < "$CLAUDE_BRANCHES_FILE.bak"
        
        rm "$CLAUDE_BRANCHES_FILE.bak"
    fi
    
    success "Cleanup completed"
}

# Merge Claude work back to main
merge_claude_work() {
    local claude_id="$1"
    local target_branch="${2:-main}"
    local branch_name="claude-work/$claude_id"
    
    if ! git show-ref --verify --quiet "refs/heads/$branch_name"; then
        error "Branch $branch_name does not exist"
        return 1
    fi
    
    log "Merging $branch_name into $target_branch"
    
    # Switch to target branch and update
    git checkout "$target_branch"
    git pull origin "$target_branch" 2>/dev/null || warn "Could not pull from origin/$target_branch"
    
    # Merge the Claude branch
    if git merge --no-ff "$branch_name" -m "Merge Claude work from $claude_id"; then
        success "Successfully merged $branch_name into $target_branch"
        
        # Optionally delete the branch
        read -p "Delete the Claude branch $branch_name? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git branch -d "$branch_name"
            # Remove from tracking file
            if [ -f "$CLAUDE_BRANCHES_FILE" ]; then
                grep -v "^$claude_id:" "$CLAUDE_BRANCHES_FILE" > "$CLAUDE_BRANCHES_FILE.tmp" || true
                mv "$CLAUDE_BRANCHES_FILE.tmp" "$CLAUDE_BRANCHES_FILE"
            fi
            success "Deleted branch $branch_name"
        fi
    else
        error "Merge failed. Please resolve conflicts manually."
        return 1
    fi
}

# Show status of current Claude work
status() {
    local current_branch=$(git branch --show-current)
    
    if [[ "$current_branch" == claude-work/* ]]; then
        local claude_id="${current_branch#claude-work/}"
        log "Current Claude instance: $claude_id"
        log "Branch: $current_branch"
        
        # Show uncommitted changes
        if ! git diff-index --quiet HEAD --; then
            warn "Uncommitted changes detected:"
            git status --porcelain
        else
            success "Working directory is clean"
        fi
        
        # Show commits ahead of main
        local ahead_count=$(git rev-list --count main.."$current_branch" 2>/dev/null || echo "0")
        if [ "$ahead_count" -gt 0 ]; then
            log "Commits ahead of main: $ahead_count"
            git log --oneline main.."$current_branch"
        fi
    else
        log "Not currently on a Claude branch"
        log "Current branch: $current_branch"
    fi
}

# Main command dispatcher
case "${1:-help}" in
    "new"|"create")
        claude_id=$(get_claude_id)
        create_claude_branch "$claude_id" "$2"
        ;;
    "switch"|"checkout")
        if [ -z "$2" ]; then
            error "Please provide Claude instance ID"
            exit 1
        fi
        switch_claude_branch "$2"
        ;;
    "list"|"ls")
        list_claude_branches
        ;;
    "cleanup")
        cleanup_claude_branches "$2"
        ;;
    "merge")
        if [ -z "$2" ]; then
            error "Please provide Claude instance ID"
            exit 1
        fi
        merge_claude_work "$2" "$3"
        ;;
    "status"|"st")
        status
        ;;
    "help"|"--help"|"-h")
        echo "Claude Git Manager - Multi-instance branching system"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  new [base_branch]     Create new Claude branch (default: main)"
        echo "  switch <claude_id>    Switch to Claude instance branch"
        echo "  list                  List all Claude branches"
        echo "  cleanup [days]        Clean up old branches (default: 7 days)"
        echo "  merge <claude_id>     Merge Claude work to main"
        echo "  status                Show current Claude work status"
        echo "  help                  Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  CLAUDE_INSTANCE_ID    Use specific Claude instance ID"
        echo ""
        echo "Examples:"
        echo "  $0 new                # Create new Claude branch"
        echo "  $0 switch claude-20240522-1234-abcd"
        echo "  $0 merge claude-20240522-1234-abcd"
        echo "  $0 cleanup 3          # Clean branches older than 3 days"
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac