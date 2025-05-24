# Offline Git Workflow - Flying & Remote Work

This document provides a complete guide for working offline with the SCB Sapphire Finsight project, including Claude multi-instance support and local repository synchronization.

## 🎯 Quick Setup

```bash
# One-time setup (already completed)
./scripts/setup-local-repo.sh setup

# Install Git hooks for enhanced workflow
./scripts/claude-git-hooks.sh install
```

## 🛩️ Pre-Flight Checklist

### 1. Sync Everything to Local Repository
```bash
# Ensure all current work is committed
git status
git add .
git commit -m "Pre-flight commit"

# Sync to local repository
npm run sync:local
```

### 2. Create Claude Branches for Planned Work
```bash
# Create Claude branch for feature work
npm run claude:new

# Note the Claude instance ID for later use
# Example: claude-20240522-143000-abcd1234
```

### 3. Verify Offline Status
```bash
# Check everything is ready for offline work
npm run offline:status
```

## ✈️ In-Flight Workflow

### Working with Claude Instances
```bash
# Check current status
npm run offline:status

# Create new Claude branch if needed
npm run claude:new

# Switch between Claude branches
npm run claude:list
./scripts/claude-git-manager.sh switch <claude-id>

# Regular development workflow
git add .
git commit -m "In-flight changes"

# Sync to local repository (works offline)
npm run sync:local
```

### Multiple Feature Development
```bash
# Feature 1: UI improvements
npm run claude:new  # Creates claude-20240522-143000-feat1
# Work on UI changes
git commit -m "Improve UI responsiveness"

# Feature 2: API enhancements  
npm run claude:new  # Creates claude-20240522-143500-feat2
# Work on API changes
git commit -m "Add new API endpoints"

# Switch between features
./scripts/claude-git-manager.sh switch claude-20240522-143000-feat1
./scripts/claude-git-manager.sh switch claude-20240522-143500-feat2

# Sync all work to local
npm run sync:local
```

### Offline Commands Available

| Command | Purpose |
|---------|---------|
| `npm run offline:status` | Show offline work status |
| `npm run claude:new` | Create new Claude branch |
| `npm run claude:list` | List all Claude branches |
| `npm run claude:status` | Show current Claude work |
| `npm run sync:local` | Push changes to local repo |
| `git log --oneline` | See commit history |
| `git branch` | Show all branches |

## 🛬 Post-Flight Workflow

### 1. Check Connectivity and Remote Status
```bash
# Test internet connection
ping github.com

# Fetch latest from remote
git fetch origin

# Check for conflicts with remote
git status
```

### 2. Merge Remote Changes (if any)
```bash
# If there are remote changes, merge them
git merge origin/main

# Resolve any conflicts if they exist
# Edit conflicted files, then:
git add .
git commit -m "Resolve merge conflicts"
```

### 3. Push Local Work to Remote
```bash
# For each Claude branch you want to push
./scripts/claude-git-manager.sh list

# Push specific Claude branch
git push origin claude-work/<claude-id>

# Or merge Claude work to main first
./scripts/claude-git-manager.sh merge <claude-id>
git push origin main
```

### 4. Clean Up
```bash
# Clean up old Claude branches
npm run claude:cleanup

# Sync final state to local
npm run sync:local
```

## 🔄 Repository Structure

```
Project Root
├── origin (GitHub)          # Remote repository
├── local                    # Local offline repository  
│   └── /Users/apple/git-repos-local/scb-sapphire-finsight-local.git
└── working directory        # Your development workspace
```

### Branch Strategy
```
main
├── claude-work/claude-20240522-143000-feat1
├── claude-work/claude-20240522-143500-feat2  
├── claude-work/claude-20240522-144000-bugfix
└── ...
```

## 🛠️ Advanced Offline Scenarios

### Scenario 1: Extended Offline Period
```bash
# Day 1: Start work
npm run claude:new
# Work and commit regularly
git commit -m "Day 1 progress"
npm run sync:local

# Day 2: Continue work  
# Work and commit
git commit -m "Day 2 improvements"
npm run sync:local

# Day 3: New feature
npm run claude:new  # New branch for different feature
# Work on new feature
git commit -m "New feature implementation"
npm run sync:local
```

### Scenario 2: Collaboration Preparation
```bash
# Prepare work for team review
./scripts/claude-git-manager.sh list

# Merge stable features
./scripts/claude-git-manager.sh merge claude-20240522-143000-feat1

# Keep experimental work in branches
git push origin claude-work/claude-20240522-144000-experiment
```

### Scenario 3: Emergency Fixes
```bash
# Quick hotfix branch
npm run claude:new
git checkout main  # Switch base to main for hotfix
git checkout -b hotfix-20240522
# Make urgent fix
git commit -m "Emergency fix for critical issue"
npm run sync:local
```

## 🚨 Troubleshooting

### Issue: Local Repository Not Found
```bash
# Re-run setup
./scripts/setup-local-repo.sh setup

# Or check status
./scripts/setup-local-repo.sh info
```

### Issue: Sync Failures
```bash
# Check local remote configuration
git remote -v

# Verify local repository exists
ls -la /Users/apple/git-repos-local/

# Manual sync if scripts fail
git push local $(git branch --show-current)
```

### Issue: Merge Conflicts After Flight
```bash
# See conflicted files
git status

# Open each conflicted file and resolve
# Look for <<<<<<< HEAD sections

# After resolving conflicts
git add .
git commit -m "Resolve post-flight merge conflicts"
```

### Issue: Large Files or Performance
```bash
# Check repository size
du -sh .git/

# Clean up if needed
git gc --aggressive
npm run claude:cleanup 30  # Clean branches older than 30 days
```

## 📊 Monitoring & Analytics

### Track Your Offline Work
```bash
# See all commits during offline period
git log --since="2024-05-20" --until="2024-05-25" --oneline

# See changes by Claude instance
git log --grep="claude-20240522" --oneline

# Check repository health
git fsck
```

### Performance Metrics
```bash
# Repository size
du -sh .git/

# Branch count
git branch -a | wc -l

# Local repository size
du -sh /Users/apple/git-repos-local/
```

## 🔧 Customization

### Custom Local Repository Location
```bash
# Use different location
./scripts/setup-local-repo.sh setup /path/to/your/offline/repos
```

### Environment Variables
```bash
# Set custom Claude instance ID
export CLAUDE_INSTANCE_ID=claude-flight-work-001

# Use custom local repo path
export LOCAL_REPO_PATH=/custom/path/to/repos
```

### Git Configuration for Offline
```bash
# Configure Git for better offline experience
git config core.preloadindex true
git config core.fscache true
git config gc.auto 256
```

## 🎯 Best Practices

### Before Flying
- ✅ Commit all work
- ✅ Sync to local repository
- ✅ Create planned Claude branches
- ✅ Test offline status
- ✅ Download any needed documentation

### During Flight
- ✅ Commit frequently with descriptive messages
- ✅ Use Claude branches for different features
- ✅ Sync to local after major milestones
- ✅ Keep work organized and documented

### After Landing
- ✅ Fetch remote changes first
- ✅ Resolve any conflicts carefully
- ✅ Test merged code before pushing
- ✅ Push incrementally, not all at once
- ✅ Clean up branches when done

## 📞 Emergency Procedures

### If Local Repository Corrupts
```bash
# Backup current work
cp -r .git .git.backup

# Recreate local repository
./scripts/setup-local-repo.sh setup

# Restore work from backup if needed
```

### If Working Directory Issues
```bash
# Check Git status
git status
git log --oneline -10

# Reset to last known good state if needed
git reset --hard HEAD~1

# Or restore from local repository
git fetch local
git reset --hard local/main
```

This offline workflow ensures you can be productive during flights while maintaining code quality and collaboration capabilities.