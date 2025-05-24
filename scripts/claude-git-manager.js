#!/usr/bin/env node

/**
 * Claude Git Manager - Node.js implementation
 * Programmatic Git tree management for multiple Claude instances
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ClaudeGitManager {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.trackingFile = path.join(this.projectRoot, '.claude-branches');
        this.branchPrefix = 'claude-work';
    }

    /**
     * Generate unique Claude instance ID
     */
    generateClaudeId() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const random = crypto.randomBytes(4).toString('hex');
        return `claude-${timestamp}-${random}`;
    }

    /**
     * Get current Claude instance ID from environment or generate new one
     */
    getClaudeId() {
        return process.env.CLAUDE_INSTANCE_ID || this.generateClaudeId();
    }

    /**
     * Execute git command safely
     */
    execGit(command, options = {}) {
        try {
            const result = execSync(`git ${command}`, {
                cwd: this.projectRoot,
                encoding: 'utf8',
                stdio: options.silent ? 'pipe' : 'inherit',
                ...options
            });
            return result ? result.trim() : '';
        } catch (error) {
            if (!options.silent) {
                console.error(`Git command failed: git ${command}`);
                console.error(error.message);
            }
            throw error;
        }
    }

    /**
     * Check if branch exists
     */
    branchExists(branchName) {
        try {
            this.execGit(`show-ref --verify --quiet refs/heads/${branchName}`, { silent: true });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get current branch name
     */
    getCurrentBranch() {
        return this.execGit('branch --show-current', { silent: true });
    }

    /**
     * Create a new Claude branch
     */
    createClaudeBranch(claudeId = null, baseBranch = 'main') {
        claudeId = claudeId || this.getClaudeId();
        const branchName = `${this.branchPrefix}/${claudeId}`;

        console.log(`🌳 Creating branch ${branchName} from ${baseBranch}`);

        try {
            // Ensure we're on the base branch and it's up to date
            this.execGit(`checkout ${baseBranch}`);
            try {
                this.execGit(`pull origin ${baseBranch}`, { silent: true });
            } catch {
                console.warn(`⚠️ Could not pull from origin/${baseBranch}`);
            }

            // Create and checkout the new branch
            this.execGit(`checkout -b ${branchName}`);

            // Record the branch in tracking file
            this.recordBranch(claudeId, branchName);

            console.log(`✅ Created and switched to branch: ${branchName}`);
            console.log(`📝 Claude Instance ID: ${claudeId}`);
            
            return { claudeId, branchName };
        } catch (error) {
            console.error(`❌ Failed to create branch: ${error.message}`);
            throw error;
        }
    }

    /**
     * Switch to Claude instance branch
     */
    switchClaudeBranch(claudeId) {
        const branchName = `${this.branchPrefix}/${claudeId}`;

        if (!this.branchExists(branchName)) {
            throw new Error(`Branch ${branchName} does not exist`);
        }

        this.execGit(`checkout ${branchName}`);
        console.log(`✅ Switched to branch: ${branchName}`);
    }

    /**
     * List all Claude branches
     */
    listClaudeBranches() {
        console.log('🌳 Active Claude branches:');
        
        try {
            const branches = this.execGit(`branch --list "${this.branchPrefix}/*"`, { silent: true });
            
            if (!branches) {
                console.log('  No Claude branches found');
                return;
            }

            branches.split('\n').forEach(branch => {
                const cleanBranch = branch.replace(/^\*?\s+/, '');
                if (cleanBranch) {
                    try {
                        const lastCommit = this.execGit(`log -1 --format="%h %s" ${cleanBranch}`, { silent: true });
                        const marker = branch.startsWith('*') ? '👉' : '  ';
                        console.log(`${marker} ${cleanBranch} - ${lastCommit}`);
                    } catch {
                        console.log(`  ${cleanBranch} - No commits`);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to list branches:', error.message);
        }

        // Show tracked instances
        this.showTrackedInstances();
    }

    /**
     * Show tracked instances from file
     */
    showTrackedInstances() {
        if (!fs.existsSync(this.trackingFile)) {
            return;
        }

        console.log('\n📋 Tracked instances:');
        const content = fs.readFileSync(this.trackingFile, 'utf8');
        
        content.split('\n').forEach(line => {
            line = line.trim();
            if (line) {
                const [claudeId, branchName, timestamp] = line.split(':');
                const date = new Date(timestamp).toLocaleString();
                console.log(`  ${claudeId} -> ${branchName} (created: ${date})`);
            }
        });
    }

    /**
     * Record branch in tracking file
     */
    recordBranch(claudeId, branchName) {
        const timestamp = new Date().toISOString();
        const record = `${claudeId}:${branchName}:${timestamp}\n`;
        fs.appendFileSync(this.trackingFile, record);
    }

    /**
     * Clean up old Claude branches
     */
    cleanupClaudeBranches(daysOld = 7) {
        console.log(`🧹 Cleaning up Claude branches older than ${daysOld} days...`);

        try {
            const branches = this.execGit(`branch --list "${this.branchPrefix}/*"`, { silent: true });
            
            if (!branches) {
                console.log('No Claude branches to clean up');
                return;
            }

            const currentTime = Date.now();
            const cutoffTime = currentTime - (daysOld * 24 * 60 * 60 * 1000);

            branches.split('\n').forEach(branch => {
                const cleanBranch = branch.replace(/^\*?\s+/, '');
                if (cleanBranch) {
                    try {
                        const lastCommitTime = parseInt(this.execGit(`log -1 --format="%ct" ${cleanBranch}`, { silent: true })) * 1000;
                        
                        if (lastCommitTime < cutoffTime) {
                            const ageDays = Math.floor((currentTime - lastCommitTime) / (24 * 60 * 60 * 1000));
                            console.log(`🗑️ Deleting old branch: ${cleanBranch} (${agedays} days old)`);
                            
                            try {
                                this.execGit(`branch -D ${cleanBranch}`, { silent: true });
                            } catch (error) {
                                console.warn(`Failed to delete ${cleanBranch}: ${error.message}`);
                            }
                        }
                    } catch (error) {
                        console.warn(`Could not check age of ${cleanBranch}: ${error.message}`);
                    }
                }
            });

            // Clean up tracking file
            this.cleanupTrackingFile();
            console.log('✅ Cleanup completed');
        } catch (error) {
            console.error('Cleanup failed:', error.message);
        }
    }

    /**
     * Clean up tracking file
     */
    cleanupTrackingFile() {
        if (!fs.existsSync(this.trackingFile)) {
            return;
        }

        const content = fs.readFileSync(this.trackingFile, 'utf8');
        const validLines = [];

        content.split('\n').forEach(line => {
            line = line.trim();
            if (line) {
                const [claudeId, branchName] = line.split(':');
                if (this.branchExists(branchName)) {
                    validLines.push(line);
                }
            }
        });

        fs.writeFileSync(this.trackingFile, validLines.join('\n') + (validLines.length ? '\n' : ''));
    }

    /**
     * Merge Claude work back to main
     */
    mergeClaudeWork(claudeId, targetBranch = 'main') {
        const branchName = `${this.branchPrefix}/${claudeId}`;

        if (!this.branchExists(branchName)) {
            throw new Error(`Branch ${branchName} does not exist`);
        }

        console.log(`🔀 Merging ${branchName} into ${targetBranch}`);

        try {
            // Switch to target branch and update
            this.execGit(`checkout ${targetBranch}`);
            try {
                this.execGit(`pull origin ${targetBranch}`, { silent: true });
            } catch {
                console.warn(`⚠️ Could not pull from origin/${targetBranch}`);
            }

            // Merge the Claude branch
            this.execGit(`merge --no-ff ${branchName} -m "Merge Claude work from ${claudeId}"`);
            console.log(`✅ Successfully merged ${branchName} into ${targetBranch}`);

            return true;
        } catch (error) {
            console.error(`❌ Merge failed: ${error.message}`);
            console.log('Please resolve conflicts manually.');
            throw error;
        }
    }

    /**
     * Show status of current Claude work
     */
    showStatus() {
        const currentBranch = this.getCurrentBranch();

        if (currentBranch.startsWith(this.branchPrefix)) {
            const claudeId = currentBranch.replace(`${this.branchPrefix}/`, '');
            console.log(`🤖 Current Claude instance: ${claudeId}`);
            console.log(`🌿 Branch: ${currentBranch}`);

            // Check for uncommitted changes
            try {
                this.execGit('diff-index --quiet HEAD --', { silent: true });
                console.log('✅ Working directory is clean');
            } catch {
                console.log('⚠️ Uncommitted changes detected:');
                this.execGit('status --porcelain');
            }

            // Show commits ahead of main
            try {
                const aheadCount = this.execGit(`rev-list --count main..${currentBranch}`, { silent: true });
                if (parseInt(aheadCount) > 0) {
                    console.log(`📈 Commits ahead of main: ${aheadCount}`);
                    this.execGit(`log --oneline main..${currentBranch}`);
                }
            } catch (error) {
                console.warn('Could not compare with main branch');
            }
        } else {
            console.log('ℹ️ Not currently on a Claude branch');
            console.log(`🌿 Current branch: ${currentBranch}`);
        }
    }
}

// CLI interface
if (require.main === module) {
    const manager = new ClaudeGitManager();
    const [,, command, ...args] = process.argv;

    try {
        switch (command) {
            case 'new':
            case 'create':
                const result = manager.createClaudeBranch(args[0], args[1]);
                console.log(`\nTo use this instance in your environment:`);
                console.log(`export CLAUDE_INSTANCE_ID=${result.claudeId}`);
                break;

            case 'switch':
            case 'checkout':
                if (!args[0]) {
                    console.error('❌ Please provide Claude instance ID');
                    process.exit(1);
                }
                manager.switchClaudeBranch(args[0]);
                break;

            case 'list':
            case 'ls':
                manager.listClaudeBranches();
                break;

            case 'cleanup':
                manager.cleanupClaudeBranches(parseInt(args[0]) || 7);
                break;

            case 'merge':
                if (!args[0]) {
                    console.error('❌ Please provide Claude instance ID');
                    process.exit(1);
                }
                manager.mergeClaudeWork(args[0], args[1]);
                break;

            case 'status':
            case 'st':
                manager.showStatus();
                break;

            case 'help':
            case '--help':
            case '-h':
            default:
                console.log('🌳 Claude Git Manager - Multi-instance branching system\n');
                console.log('Usage: node claude-git-manager.js <command> [options]\n');
                console.log('Commands:');
                console.log('  new [base_branch]     Create new Claude branch (default: main)');
                console.log('  switch <claude_id>    Switch to Claude instance branch');
                console.log('  list                  List all Claude branches');
                console.log('  cleanup [days]        Clean up old branches (default: 7 days)');
                console.log('  merge <claude_id>     Merge Claude work to main');
                console.log('  status                Show current Claude work status');
                console.log('  help                  Show this help message\n');
                console.log('Environment Variables:');
                console.log('  CLAUDE_INSTANCE_ID    Use specific Claude instance ID\n');
                console.log('Examples:');
                console.log('  node claude-git-manager.js new');
                console.log('  node claude-git-manager.js switch claude-2024-05-22T10-30-00-abcd1234');
                console.log('  node claude-git-manager.js merge claude-2024-05-22T10-30-00-abcd1234');
                console.log('  node claude-git-manager.js cleanup 3');
                break;
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

module.exports = ClaudeGitManager;