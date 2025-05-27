/*
 * FinSight Desktop - True Jony Ive Design Implementation
 * "Simplicity is the ultimate sophistication"
 * 
 * Design Principles Applied:
 * 1. Purposeful Reduction - Every element serves a function
 * 2. Material Honesty - Real materials, real interactions
 * 3. Inevitable Hierarchy - Clear information architecture
 * 4. Effortless Interaction - Natural, physics-based animations
 */

class FinSightJonyIve {
  constructor() {
    // Core State
    this.isConnected = false;
    this.currentBranch = 'Loading...';
    this.branches = [];
    this.projectStats = {
      changes: 0,
      branches: 0
    };
    
    // Settings
    this.settings = {
      darkMode: this.detectSystemTheme(),
      cleanupDays: 7
    };
    
    // UI State
    this.isLoading = false;
    this.settingsOpen = false;
    
    // Initialize
    this.init();
  }

  async init() {
    console.log('🎨 Initializing Jony Ive Interface...');
    
    // Load saved settings
    await this.loadSettings();
    
    // Setup event handlers
    this.setupEventHandlers();
    
    // Apply theme
    this.applyTheme();
    
    // Load real data
    await this.loadProjectData();
    
    // Show interface with subtle animation
    this.showInterface();
    
    console.log('✨ Interface initialized successfully');
  }

  // === CORE DATA LOADING ===
  async loadProjectData() {
    console.log('📊 Loading real project data...');
    
    this.showLoading('Loading project data...');
    
    try {
      // Load branches in parallel
      await Promise.all([
        this.loadBranches(),
        this.loadProjectStatus()
      ]);
      
      this.updateInterface();
      this.showNotification('✅ Project data loaded', 'success');
      
    } catch (error) {
      console.error('Failed to load project data:', error);
      this.showNotification('❌ Failed to load data', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async loadBranches() {
    try {
      if (window.electronAPI) {
        // Get real git branches
        const result = await window.electronAPI.gitCommand('branch');
        
        if (result.success && result.stdout) {
          const branches = result.stdout
            .split('\n')
            .map(line => {
              const isCurrent = line.startsWith('*');
              const name = line.trim().replace(/^\* /, '');
              return { name, isCurrent, type: name.startsWith('claude-work/') ? 'claude' : 'main' };
            })
            .filter(branch => branch.name);
          
          this.branches = branches;
          this.projectStats.branches = branches.length;
          
          // Update current branch
          const currentBranch = branches.find(b => b.isCurrent);
          if (currentBranch) {
            this.currentBranch = currentBranch.name;
          }
          
          console.log('📋 Loaded branches:', this.branches);
        }
      } else {
        // Fallback data for demo
        this.branches = [
          { name: 'main', isCurrent: false, type: 'main' },
          { name: 'claude-work/claude-2025-05-22T16-19-00-1fb0d540', isCurrent: true, type: 'claude' }
        ];
        this.currentBranch = 'claude-work/claude-2025-05-22T16-19-00-1fb0d540';
        this.projectStats.branches = this.branches.length;
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
      throw error;
    }
  }

  async loadProjectStatus() {
    try {
      if (window.electronAPI) {
        // Get real project status
        const status = await window.electronAPI.getProjectStatus();
        
        if (status.success) {
          this.isConnected = true;
          this.projectStats.changes = status.changeCount || 0;
          
          // Also get detailed git status
          const gitStatus = await window.electronAPI.gitCommand('status', { porcelain: true });
          if (gitStatus.success) {
            const changes = gitStatus.stdout.trim().split('\n').filter(line => line.trim());
            this.projectStats.changes = changes.length;
          }
        }
      } else {
        // Demo data
        this.isConnected = false;
        this.projectStats.changes = 7;
      }
      
      console.log('📊 Project status:', { connected: this.isConnected, changes: this.projectStats.changes });
    } catch (error) {
      console.error('Failed to load project status:', error);
      this.isConnected = false;
    }
  }

  // === UI UPDATES ===
  updateInterface() {
    this.updateProjectInfo();
    this.updateConnectionStatus();
    this.updateBranchList();
    this.updateStats();
  }

  updateProjectInfo() {
    const branchElement = document.getElementById('current-branch-name');
    if (branchElement) {
      branchElement.textContent = this.currentBranch;
    }
  }

  updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
      statusElement.classList.toggle('connected', this.isConnected);
    }
  }

  updateStats() {
    const changesElement = document.getElementById('changes-count');
    const branchesElement = document.getElementById('branches-count');
    
    if (changesElement) {
      changesElement.textContent = this.projectStats.changes.toString();
    }
    
    if (branchesElement) {
      branchesElement.textContent = this.projectStats.branches.toString();
    }
  }

  updateBranchList() {
    const branchList = document.getElementById('branch-list');
    if (!branchList) return;

    if (this.branches.length === 0) {
      branchList.innerHTML = `
        <div class="loading-state">
          <span>No branches found</span>
        </div>
      `;
      return;
    }

    // Sort branches: current first, then by type
    const sortedBranches = [...this.branches].sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      if (a.type === 'main' && b.type === 'claude') return -1;
      if (a.type === 'claude' && b.type === 'main') return 1;
      return a.name.localeCompare(b.name);
    });

    branchList.innerHTML = sortedBranches.map(branch => {
      const icon = branch.type === 'claude' ? '🤖' : '⭐';
      const typeLabel = branch.type === 'claude' ? 'Claude Branch' : 'Main Branch';
      
      return `
        <div class="branch-item ${branch.isCurrent ? 'current' : ''}" onclick="app.switchToBranch('${branch.name}')">
          <div class="branch-icon ${branch.type}">
            ${icon}
          </div>
          <div class="branch-info">
            <div class="branch-name">${branch.name}</div>
            <div class="branch-meta">
              ${branch.isCurrent ? 'Current • ' : ''}${typeLabel}
            </div>
          </div>
          <div class="branch-current-indicator"></div>
        </div>
      `;
    }).join('');
  }

  // === BRANCH OPERATIONS ===
  async switchToBranch(branchName) {
    if (branchName === this.currentBranch) {
      this.showNotification('Already on this branch', 'info');
      return;
    }

    this.showLoading(`Switching to ${branchName}...`);

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.switchBranch(branchName);
        
        if (result.success) {
          this.currentBranch = branchName;
          
          // Update branch states
          this.branches = this.branches.map(branch => ({
            ...branch,
            isCurrent: branch.name === branchName
          }));
          
          this.updateInterface();
          this.showNotification(`✅ Switched to ${branchName}`, 'success');
        } else {
          throw new Error(result.error || 'Failed to switch branch');
        }
      } else {
        // Demo mode
        await this.delay(1500);
        this.currentBranch = branchName;
        this.branches = this.branches.map(branch => ({
          ...branch,
          isCurrent: branch.name === branchName
        }));
        this.updateInterface();
        this.showNotification(`✅ Switched to ${branchName}`, 'success');
      }
    } catch (error) {
      console.error('Failed to switch branch:', error);
      this.showNotification('❌ Failed to switch branch', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async createNewBranch() {
    this.showLoading('Creating new Claude branch...');

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.createClaudeBranch();
        
        if (result.success) {
          await this.loadProjectData();
          this.showNotification('✅ New Claude branch created', 'success');
        } else {
          throw new Error(result.error || 'Failed to create branch');
        }
      } else {
        // Demo mode
        await this.delay(2000);
        const newBranchName = `claude-work/${new Date().toISOString().replace(/[:.]/g, '-')}`;
        this.branches.push({ name: newBranchName, isCurrent: true, type: 'claude' });
        this.branches = this.branches.map(branch => ({
          ...branch,
          isCurrent: branch.name === newBranchName
        }));
        this.currentBranch = newBranchName;
        this.updateInterface();
        this.showNotification('✅ New Claude branch created', 'success');
      }
    } catch (error) {
      console.error('Failed to create branch:', error);
      this.showNotification('❌ Failed to create branch', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async syncChanges() {
    this.showLoading('Syncing changes...');

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.syncToLocal();
        
        if (result.success) {
          await this.loadProjectStatus();
          this.updateStats();
          this.showNotification('✅ Changes synced', 'success');
        } else {
          throw new Error(result.error || 'Failed to sync');
        }
      } else {
        await this.delay(1500);
        this.projectStats.changes = 0;
        this.updateStats();
        this.showNotification('✅ Changes synced', 'success');
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      this.showNotification('❌ Failed to sync changes', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async cleanupBranches() {
    this.showLoading('Cleaning up old branches...');

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.cleanupBranches(this.settings.cleanupDays);
        
        if (result.success) {
          await this.loadBranches();
          this.updateBranchList();
          this.updateStats();
          this.showNotification(`✅ Cleaned up old branches`, 'success');
        } else {
          throw new Error(result.error || 'Failed to cleanup');
        }
      } else {
        await this.delay(1000);
        // Demo: remove some branches
        this.branches = this.branches.filter((branch, index) => index < 3);
        this.projectStats.branches = this.branches.length;
        this.updateBranchList();
        this.updateStats();
        this.showNotification('✅ Cleaned up old branches', 'success');
      }
    } catch (error) {
      console.error('Failed to cleanup:', error);
      this.showNotification('❌ Failed to cleanup branches', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async refreshData() {
    console.log('🔄 Refreshing data...');
    await this.loadProjectData();
  }

  // === SETTINGS ===
  async loadSettings() {
    try {
      if (window.electronAPI) {
        const settings = await window.electronAPI.getSettings();
        if (settings) {
          this.settings = { ...this.settings, ...settings };
        }
      } else {
        const stored = localStorage.getItem('finsight-jony-settings');
        if (stored) {
          this.settings = { ...this.settings, ...JSON.parse(stored) };
        }
      }
      
      console.log('⚙️ Settings loaded:', this.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveSettings(this.settings);
      } else {
        localStorage.setItem('finsight-jony-settings', JSON.stringify(this.settings));
      }
      
      console.log('💾 Settings saved:', this.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  toggleDarkMode() {
    this.settings.darkMode = !this.settings.darkMode;
    this.applyTheme();
    this.saveSettings();
    
    // Update toggle UI
    const toggle = document.getElementById('dark-mode-input');
    if (toggle) {
      toggle.checked = this.settings.darkMode;
    }
    
    this.showNotification(`${this.settings.darkMode ? '🌙' : '☀️'} Theme updated`, 'success');
  }

  updateCleanupDays(days) {
    this.settings.cleanupDays = Math.max(1, Math.min(30, parseInt(days)));
    this.saveSettings();
    
    console.log('🧹 Cleanup days updated:', this.settings.cleanupDays);
  }

  applyTheme() {
    document.body.classList.toggle('dark-mode', this.settings.darkMode);
    console.log('🎨 Theme applied:', this.settings.darkMode ? 'dark' : 'light');
  }

  detectSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // === UI INTERACTIONS ===
  openSettings() {
    this.settingsOpen = true;
    const panel = document.getElementById('settings-panel');
    if (panel) {
      panel.classList.add('open');
      
      // Update settings UI
      const darkModeToggle = document.getElementById('dark-mode-input');
      const cleanupInput = document.getElementById('cleanup-days-input');
      
      if (darkModeToggle) darkModeToggle.checked = this.settings.darkMode;
      if (cleanupInput) cleanupInput.value = this.settings.cleanupDays;
    }
  }

  closeSettings() {
    this.settingsOpen = false;
    const panel = document.getElementById('settings-panel');
    if (panel) {
      panel.classList.remove('open');
    }
  }

  showLoading(text = 'Loading...') {
    this.isLoading = true;
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    
    if (overlay) overlay.classList.add('show');
    if (loadingText) loadingText.textContent = text;
  }

  hideLoading() {
    this.isLoading = false;
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  showNotification(text, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    const notificationIcon = document.getElementById('notification-icon');
    
    if (notification && notificationText && notificationIcon) {
      // Set content
      notificationText.textContent = text;
      
      // Set icon based on type
      notificationIcon.className = `notification-icon ${type}`;
      if (type === 'success') {
        notificationIcon.innerHTML = '✓';
      } else if (type === 'error') {
        notificationIcon.innerHTML = '✕';
      } else {
        notificationIcon.innerHTML = 'ℹ';
      }
      
      // Show notification
      notification.classList.add('show');
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }
  }

  showInterface() {
    // Add entrance animation
    const app = document.getElementById('app');
    if (app) {
      app.style.opacity = '0';
      app.style.transform = 'scale(0.95)';
      
      requestAnimationFrame(() => {
        app.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        app.style.opacity = '1';
        app.style.transform = 'scale(1)';
      });
    }
  }

  // === EVENT HANDLERS ===
  setupEventHandlers() {
    console.log('🎛️ Setting up event handlers...');
    
    // Settings
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettings = document.getElementById('close-settings');
    const darkModeToggle = document.getElementById('dark-mode-input');
    const cleanupInput = document.getElementById('cleanup-days-input');
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettings());
    }
    
    if (closeSettings) {
      closeSettings.addEventListener('click', () => this.closeSettings());
    }
    
    if (darkModeToggle) {
      darkModeToggle.addEventListener('change', () => this.toggleDarkMode());
    }
    
    if (cleanupInput) {
      cleanupInput.addEventListener('change', (e) => this.updateCleanupDays(e.target.value));
    }
    
    // Actions
    const newBranchBtn = document.getElementById('new-branch-btn');
    const syncBtn = document.getElementById('sync-btn');
    const cleanupBtn = document.getElementById('cleanup-btn');
    const refreshBtn = document.getElementById('refresh-branches');
    
    if (newBranchBtn) {
      newBranchBtn.addEventListener('click', () => this.createNewBranch());
    }
    
    if (syncBtn) {
      syncBtn.addEventListener('click', () => this.syncChanges());
    }
    
    if (cleanupBtn) {
      cleanupBtn.addEventListener('click', () => this.cleanupBranches());
    }
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            this.createNewBranch();
            break;
          case 's':
            e.preventDefault();
            this.syncChanges();
            break;
          case ',':
            e.preventDefault();
            this.openSettings();
            break;
          case 'r':
            e.preventDefault();
            this.refreshData();
            break;
        }
      } else if (e.key === 'Escape') {
        this.closeSettings();
      }
    });
    
    // System theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!this.settings.hasManualTheme) {
          this.settings.darkMode = e.matches;
          this.applyTheme();
        }
      });
    }
    
    console.log('✅ Event handlers configured');
  }

  // === UTILITIES ===
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize app when DOM is loaded
let app;

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Starting FinSight Desktop - Jony Ive Edition');
  app = new FinSightJonyIve();
});

// Make app globally available for HTML onclick handlers
window.app = app;