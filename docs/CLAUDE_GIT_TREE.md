# Claude Git Tree - Multi-Instance Management

This document describes the Git tree system for managing multiple Claude instances working simultaneously on the same project.

## Overview

The Claude Git Tree system allows multiple Claude instances to work on different features or fixes simultaneously without conflicts. Each Claude instance works in its own dedicated branch, and changes can be merged back to the main branch when ready.

## Architecture

```
main (production)
├── claude-work/claude-20240522-103000-abcd1234 (Claude Instance 1)
├── claude-work/claude-20240522-103500-efgh5678 (Claude Instance 2)
├── claude-work/claude-20240522-104000-ijkl9012 (Claude Instance 3)
└── ...
```

### Branch Naming Convention

- **Pattern**: `claude-work/<claude-instance-id>`
- **Claude Instance ID**: `claude-YYYYMMDD-HHMMSS-<random-hex>`
- **Example**: `claude-work/claude-20240522-103000-abcd1234`

## Tools Available

### 1. Shell Script (`scripts/claude-git-manager.sh`)

Bash-based Git management for command-line operations.

```bash
# Create new Claude branch
./scripts/claude-git-manager.sh new

# Switch to existing Claude branch
./scripts/claude-git-manager.sh switch claude-20240522-103000-abcd1234

# List all Claude branches
./scripts/claude-git-manager.sh list

# Merge Claude work to main
./scripts/claude-git-manager.sh merge claude-20240522-103000-abcd1234

# Clean up old branches (older than 7 days)
./scripts/claude-git-manager.sh cleanup

# Show current status
./scripts/claude-git-manager.sh status
```

### 2. Node.js Module (`scripts/claude-git-manager.js`)

Programmatic Git management for integration with build tools and automation.

```bash
# Create new Claude branch
node scripts/claude-git-manager.js new

# Switch to existing Claude branch
node scripts/claude-git-manager.js switch claude-20240522-103000-abcd1234

# List all Claude branches
node scripts/claude-git-manager.js list

# Merge Claude work to main
node scripts/claude-git-manager.js merge claude-20240522-103000-abcd1234

# Clean up old branches
node scripts/claude-git-manager.js cleanup 7

# Show current status
node scripts/claude-git-manager.js status
```

## NPM Scripts (Package.json Integration)

```bash
# Quick commands via npm
npm run claude:new          # Create new Claude branch
npm run claude:list         # List Claude branches
npm run claude:status       # Show current status
npm run claude:cleanup      # Clean up old branches
```

## Usage Workflows

### Starting New Work

1. **Create a new Claude branch**:
   ```bash
   ./scripts/claude-git-manager.sh new
   # or
   npm run claude:new
   ```

2. **Set environment variable** (if not using auto-generated ID):
   ```bash
   export CLAUDE_INSTANCE_ID=claude-20240522-103000-abcd1234
   ```

3. **Start working** on your changes in the isolated branch.

### Working with Multiple Claudes

1. **Claude Instance 1** works on feature A:
   ```bash
   ./scripts/claude-git-manager.sh new
   # Creates: claude-work/claude-20240522-103000-abcd1234
   ```

2. **Claude Instance 2** works on feature B:
   ```bash
   ./scripts/claude-git-manager.sh new
   # Creates: claude-work/claude-20240522-103500-efgh5678
   ```

3. **Both instances work independently** without conflicts.

### Merging Work

1. **Review changes**:
   ```bash
   ./scripts/claude-git-manager.sh status
   ```

2. **Merge to main**:
   ```bash
   ./scripts/claude-git-manager.sh merge claude-20240522-103000-abcd1234
   ```

3. **Clean up** (optional):
   ```bash
   ./scripts/claude-git-manager.sh cleanup
   ```

## Branch Tracking

The system maintains a tracking file (`.claude-branches`) that records:
- Claude instance ID
- Branch name
- Creation timestamp

This allows for:
- Easy identification of active Claude instances
- Automatic cleanup of old branches
- Status reporting and monitoring

## Environment Variables

- **`CLAUDE_INSTANCE_ID`**: Override auto-generated Claude instance ID
- **`CLAUDE_BASE_BRANCH`**: Override default base branch (default: main)

## Best Practices

### For Claude Instances

1. **Always create a new branch** before starting work
2. **Commit frequently** with descriptive messages
3. **Check status regularly** to monitor your work
4. **Merge when ready** and clean up your branch

### For Project Maintainers

1. **Review merge requests** before accepting
2. **Run cleanup regularly** to remove old branches
3. **Monitor active instances** using the list command
4. **Set up automated cleanup** in CI/CD pipelines

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Claude Branch Cleanup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Cleanup old Claude branches
        run: |
          ./scripts/claude-git-manager.sh cleanup 7
          git push origin --delete $(git branch -r --list "origin/claude-work/*" | grep -E "claude-work/claude-[0-9]{8}-[0-9]{6}-[a-f0-9]{8}" | sed 's/origin\///' | xargs)
```

### Vercel Integration

```javascript
// In vercel.json or build script
{
  "buildCommand": "node scripts/claude-git-manager.js status && npm run build"
}
```

## Troubleshooting

### Common Issues

1. **Branch conflicts**:
   ```bash
   # Force cleanup if needed
   git branch -D claude-work/problematic-branch
   ```

2. **Merge conflicts**:
   ```bash
   # Manual resolution required
   git status
   # Resolve conflicts, then:
   git add .
   git commit
   ```

3. **Tracking file corruption**:
   ```bash
   # Regenerate tracking file
   rm .claude-branches
   ./scripts/claude-git-manager.sh list
   ```

### Debug Mode

Enable verbose output by setting:
```bash
export CLAUDE_GIT_DEBUG=1
```

## Security Considerations

- **Branch isolation**: Each Claude instance is isolated in its own branch
- **No direct main access**: Prevents accidental damage to production code
- **Tracking and audit**: All Claude activities are logged and trackable
- **Automatic cleanup**: Prevents branch proliferation and repository bloat

## Future Enhancements

- **Web UI**: Browser-based management interface
- **Slack/Discord integration**: Branch notifications
- **Advanced merging**: Smart conflict resolution
- **Performance metrics**: Branch activity analytics
- **Integration testing**: Automated testing before merge