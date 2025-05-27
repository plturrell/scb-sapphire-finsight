/*
 * FinSight Desktop - Jony Ive Inspired Interaction Design
 * Principles: Purposeful State Management, Fluid Transitions, Contextual Clarity
 */

class FinSightApp {
  constructor() {
    // Core State
    this.currentProject = '/Users/apple/projects/scb-sapphire-finsight';
    this.currentState = 'ready'; // ready, loading, error, success
    this.currentContext = 'home'; // home, branches, settings
    this.isConnected = false;
        
    // Settings
    this.settings = {
      cleanupDays: 7,
      darkMode: this.detectSystemDarkMode()
    };
        
    // State Machine
    this.states = {
      ready: {
        title: 'Ready',
        subtitle: 'Select an action to begin',
        primaryAction: 'New Branch',
        primaryHandler: () => this.createNewBranch()
      },
      loading: {
        title: 'Working...',
        subtitle: 'Please wait',
        primaryAction: null,
        primaryHandler: null
      },
      branches: {
        title: 'Select Branch',
        subtitle: 'Choose a Claude branch to switch to',
        primaryAction: 'Create New',
        primaryHandler: () => this.createNewBranch()
      },
      error: {
        title: 'Something went wrong',
        subtitle: 'Please try again',
        primaryAction: 'Retry',
        primaryHandler: () => this.setState('ready')
      },
      success: {
        title: 'Done',
        subtitle: 'Action completed successfully',
        primaryAction: 'Continue',
        primaryHandler: () => this.setState('ready')
      }
    };
        
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.setupMenuHandlers();
    this.applySettings();
    this.checkProjectStatus();
        
    // Initialize with gentle animation
    setTimeout(() => {
      document.body.classList.add('slide-in');
    }, 100);
  }

  // === STATE MANAGEMENT ===
  setState(newState, context = null) {
    if (this.currentState === newState) return;
        
    const previousState = this.currentState;
    this.currentState = newState;
        
    if (context) {
      this.currentContext = context;
    }
        
    // Update UI with smooth transition
    this.updateStateDisplay();
    this.updateActions();
    this.logStateChange(previousState, newState);
  }

  updateStateDisplay() {
    const state = this.states[this.currentState];
    const titleEl = document.getElementById('primary-title');
    const subtitleEl = document.getElementById('secondary-info');
    const displayEl = document.getElementById('state-display');
        
    // Remove existing state classes
    displayEl.className = 'state-display';
        
    // Add current state class for styling
    displayEl.classList.add(`state-${this.currentState}`);
        
    // Update content with smooth transition
    this.smoothTextTransition(titleEl, state.title);
    this.smoothTextTransition(subtitleEl, state.subtitle);
        
    // Update details based on context
    this.updateStateDetails();
  }

  updateStateDetails() {
    const detailsEl = document.getElementById('state-details');
        
    switch (this.currentContext) {
    case 'home':
      this.showProjectInfo(detailsEl);
      break;
    case 'branches':
      this.showBranchList(detailsEl);
      break;
    case 'status':
      this.showGitStatus(detailsEl);
      break;
    default:
      detailsEl.innerHTML = '';
    }
  }

  updateActions() {
    const state = this.states[this.currentState];
    const primaryBtn = document.getElementById('primary-action');
    const primaryText = primaryBtn.querySelector('.btn-text');
    const secondaryActions = document.getElementById('action-secondary');
        
    // Update primary action
    if (state.primaryAction) {
      primaryBtn.style.display = 'inline-flex';
      this.smoothTextTransition(primaryText, state.primaryAction);
      primaryBtn.onclick = state.primaryHandler;
    } else {
      primaryBtn.style.display = 'none';
    }
        
    // Show/hide secondary actions based on state
    if (this.currentState === 'loading') {
      secondaryActions.style.opacity = '0.5';
      secondaryActions.style.pointerEvents = 'none';
    } else {
      secondaryActions.style.opacity = '1';
      secondaryActions.style.pointerEvents = 'auto';
    }
  }

  // === UI UTILITIES ===
  smoothTextTransition(element, newText) {
    if (element.textContent === newText) return;
        
    element.style.transition = 'opacity 0.2s var(--transition-gentle)';
    element.style.opacity = '0';
        
    setTimeout(() => {
      element.textContent = newText;
      element.style.opacity = '1';
    }, 200);
  }

  showProjectInfo(container) {
    container.innerHTML = `
            <div class="project-status">
                <div class="status-item">
                    <span class="status-label">Project:</span>
                    <span class="status-value">FinSight</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Connection:</span>
                    <span class="status-value ${this.isConnected ? 'connected' : 'offline'}">
                        ${this.isConnected ? 'Connected' : 'Offline'}
                    </span>
                </div>
            </div>
        `;
  }

  showBranchList(container) {
    // Placeholder for branch list - would be populated with actual data
    container.innerHTML = `
            <div class="branch-preview">
                <div class="branch-item-preview">
                    <span class="branch-name">claude-work/main-branch</span>
                    <span class="branch-date">2 hours ago</span>
                </div>
                <div class="branch-item-preview">
                    <span class="branch-name">claude-work/feature-branch</span>
                    <span class="branch-date">1 day ago</span>
                </div>
            </div>
        `;
  }

  showGitStatus(container) {
    container.innerHTML = `
            <div class="git-status-preview">
                <div class="status-item">
                    <span class="status-label">Branch:</span>
                    <span class="status-value">main</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Changes:</span>
                    <span class="status-value">3 modified</span>
                </div>
            </div>
        `;
  }

  // === EVENT HANDLERS ===
  setupEventListeners() {
    // Primary actions
    document.getElementById('switch-action').onclick = () => this.showBranchSelector();
    document.getElementById('sync-action').onclick = () => this.syncToLocal();
    document.getElementById('status-action').onclick = () => this.showStatus();
        
    // Status indicator click
    document.getElementById('status-indicator').onclick = () => this.toggleSettings();
        
    // Modal handlers
    document.getElementById('modal-close').onclick = () => this.hideModal();
    document.getElementById('modal-overlay').onclick = (e) => {
      if (e.target === e.currentTarget) this.hideModal();
    };
        
    // Settings
    document.getElementById('dark-mode-toggle').onchange = (e) => {
      this.settings.darkMode = e.target.checked;
      this.applyDarkMode();
      this.saveSettings();
    };
        
    document.getElementById('cleanup-days').onchange = (e) => {
      this.settings.cleanupDays = parseInt(e.target.value);
      this.saveSettings();
    };
        
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  setupMenuHandlers() {
    // Listen for menu actions from main process
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((event, action) => {
        this.handleMenuAction(action);
      });

      window.electronAPI.onProjectFolderSelected((event, folderPath) => {
        this.currentProject = folderPath;
        this.checkProjectStatus();
      });

      window.electronAPI.onAppFocused(() => {
        this.checkProjectStatus();
      });
    }
  }

  handleMenuAction(action) {
    const actions = {
      'new-branch': () => this.createNewBranch(),
      'refresh-status': () => this.refreshStatus(),
      'sync-local': () => this.syncToLocal(),
      'cleanup-branches': () => this.cleanupBranches(),
      'start-claude': () => this.startClaudeSession(),
      'switch-branch': () => this.showBranchSelector()
    };
        
    if (actions[action]) {
      actions[action]();
    }
  }

  handleKeyboard(e) {
    // Escape key
    if (e.key === 'Escape') {
      this.hideModal();
      this.hideSettings();
      this.setState('ready');
    }
        
    // Command/Ctrl shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
      case 'n':
        e.preventDefault();
        this.createNewBranch();
        break;
      case 'b':
        e.preventDefault();
        this.showBranchSelector();
        break;
      case 's':
        e.preventDefault();
        this.syncToLocal();
        break;
      case ',':
        e.preventDefault();
        this.toggleSettings();
        break;
      }
    }
  }

  // === CORE ACTIONS ===
  async createNewBranch() {
    this.setState('loading');
        
    try {
      // Simulate API call
      await this.delay(1500);
            
      if (window.electronAPI) {
        const result = await window.electronAPI.createClaudeBranch();
        if (result.success) {
          this.setState('success');
          setTimeout(() => this.setState('ready'), 2000);
        } else {
          throw new Error(result.error);
        }
      } else {
        // Demo mode
        this.setState('success');
        setTimeout(() => this.setState('ready'), 2000);
      }
    } catch (error) {
      this.setState('error');
      this.logError('Failed to create branch', error);
    }
  }

  async showBranchSelector() {
    this.setState('loading');
        
    try {
      // Load branches
      await this.delay(800);
      this.setState('branches', 'branches');
      this.showModal('Select Branch', this.generateBranchSelector());
    } catch (error) {
      this.setState('error');
      this.logError('Failed to load branches', error);
    }
  }

  async syncToLocal() {
    this.setState('loading');
        
    try {
      await this.delay(1200);
            
      if (window.electronAPI) {
        const result = await window.electronAPI.syncToLocal();
        if (result.success) {
          this.setState('success');
          setTimeout(() => this.setState('ready'), 1500);
        } else {
          throw new Error(result.error);
        }
      } else {
        this.setState('success');
        setTimeout(() => this.setState('ready'), 1500);
      }
    } catch (error) {
      this.setState('error');
      this.logError('Failed to sync', error);
    }
  }

  showStatus() {
    this.setState('ready', 'status');
    this.updateConnectionStatus();
  }

  async refreshStatus() {
    const indicator = document.getElementById('status-indicator');
    indicator.classList.add('loading');
        
    try {
      await this.checkProjectStatus();
      await this.delay(500);
    } finally {
      indicator.classList.remove('loading');
    }
  }

  // === MODAL MANAGEMENT ===
  showModal(title, content) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
        
    titleEl.textContent = title;
    bodyEl.innerHTML = content;
        
    overlay.classList.add('visible');
  }

  hideModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('visible');
        
    // Return to ready state if we were in a modal-specific state
    if (this.currentState === 'branches') {
      this.setState('ready');
    }
  }

  generateBranchSelector() {
    return `
            <div class="branch-selector">
                <div class="branch-option" onclick="app.selectBranch('claude-work/main-branch')">
                    <div class="branch-info">
                        <div class="branch-name">claude-work/main-branch</div>
                        <div class="branch-meta">Last commit: 2 hours ago</div>
                    </div>
                </div>
                <div class="branch-option" onclick="app.selectBranch('claude-work/feature-branch')">
                    <div class="branch-info">
                        <div class="branch-name">claude-work/feature-branch</div>
                        <div class="branch-meta">Last commit: 1 day ago</div>
                    </div>
                </div>
            </div>
        `;
  }

  async selectBranch(branchName) {
    this.hideModal();
    this.setState('loading');
        
    try {
      await this.delay(1000);
            
      if (window.electronAPI) {
        const result = await window.electronAPI.switchBranch(branchName);
        if (result.success) {
          this.setState('success');
          setTimeout(() => this.setState('ready'), 1500);
        } else {
          throw new Error(result.error);
        }
      } else {
        this.setState('success');
        setTimeout(() => this.setState('ready'), 1500);
      }
    } catch (error) {
      this.setState('error');
      this.logError('Failed to switch branch', error);
    }
  }

  // === SETTINGS MANAGEMENT ===
  toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('visible');
  }

  hideSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.remove('visible');
  }

  async loadSettings() {
    try {
      if (window.electronAPI) {
        const stored = await window.electronAPI.getSettings();
        if (stored) {
          this.settings = { ...this.settings, ...stored };
        }
      } else {
        // Local storage fallback
        const stored = localStorage.getItem('finsight-settings');
        if (stored) {
          this.settings = { ...this.settings, ...JSON.parse(stored) };
        }
      }
    } catch (error) {
      this.logError('Failed to load settings', error);
    }
  }

  async saveSettings() {
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveSettings(this.settings);
      } else {
        localStorage.setItem('finsight-settings', JSON.stringify(this.settings));
      }
    } catch (error) {
      this.logError('Failed to save settings', error);
    }
  }

  applySettings() {
    // Apply dark mode
    this.applyDarkMode();
        
    // Update UI elements
    document.getElementById('dark-mode-toggle').checked = this.settings.darkMode;
    document.getElementById('cleanup-days').value = this.settings.cleanupDays;
  }

  applyDarkMode() {
    if (this.settings.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  detectSystemDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // === CONNECTION MANAGEMENT ===
  async checkProjectStatus() {
    try {
      if (window.electronAPI) {
        const status = await window.electronAPI.getProjectStatus(this.currentProject);
        this.isConnected = status.connected;
      } else {
        // Demo mode - simulate connection
        this.isConnected = Math.random() > 0.3;
      }
            
      this.updateConnectionStatus();
    } catch (error) {
      this.isConnected = false;
      this.updateConnectionStatus();
      this.logError('Failed to check project status', error);
    }
  }

  updateConnectionStatus() {
    const indicator = document.getElementById('status-indicator');
        
    if (this.isConnected) {
      indicator.classList.add('connected');
    } else {
      indicator.classList.remove('connected');
    }
        
    // Update project info if visible
    if (this.currentContext === 'home') {
      this.updateStateDetails();
    }
  }

  // === UTILITIES ===
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  logStateChange(from, to) {
    console.log(`State transition: ${from} → ${to}`);
  }

  logError(message, error) {
    console.error(`${message}:`, error);
  }

  // === ADDITIONAL ACTIONS ===
  async cleanupBranches() {
    this.setState('loading');
        
    try {
      await this.delay(1000);
            
      if (window.electronAPI) {
        const result = await window.electronAPI.cleanupBranches(this.settings.cleanupDays);
        if (result.success) {
          this.setState('success');
          setTimeout(() => this.setState('ready'), 1500);
        } else {
          throw new Error(result.error);
        }
      } else {
        this.setState('success');
        setTimeout(() => this.setState('ready'), 1500);
      }
    } catch (error) {
      this.setState('error');
      this.logError('Failed to cleanup branches', error);
    }
  }

  async startClaudeSession() {
    if (window.electronAPI) {
      window.electronAPI.startClaudeSession();
    }
  }
}

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new FinSightApp();
});

// Make app globally available for HTML onclick handlers
window.app = app;