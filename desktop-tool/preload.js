/*
 * FinSight Desktop - Jony Ive Design Philosophy
 * Preload Script: Secure, Minimal API Bridge
 */

const { contextBridge, ipcRenderer } = require('electron');

// === SECURE API BRIDGE ===
// Expose only essential methods with input validation and security controls

contextBridge.exposeInMainWorld('electronAPI', {
  // === GIT OPERATIONS - SCOPED & SECURE ===
    
  // Create new Claude branch
  createClaudeBranch: () => ipcRenderer.invoke('create-claude-branch'),
    
  // Switch to existing branch
  switchBranch: (branchName) => {
    if (typeof branchName !== 'string' || !branchName.startsWith('claude-work/')) {
      throw new Error('Invalid branch name');
    }
    return ipcRenderer.invoke('switch-branch', branchName);
  },
    
  // Sync changes to local repository
  syncToLocal: () => ipcRenderer.invoke('sync-to-local'),
    
  // Cleanup old branches
  cleanupBranches: (days = 7) => {
    const cleanupDays = Math.max(1, Math.min(30, parseInt(days)));
    return ipcRenderer.invoke('cleanup-branches', cleanupDays);
  },
    
  // Get project status
  getProjectStatus: (projectPath) => ipcRenderer.invoke('get-project-status', projectPath),
    
  // Get Claude branches
  getClaudeBranches: () => ipcRenderer.invoke('get-claude-branches'),
    
  // Generic git command (restricted)
  gitCommand: (command, options = {}) => {
    // Whitelist safe git commands
    const safeCommands = [
      'status', 'branch', 'log', 'diff', 'show', 'ls-files'
    ];
        
    if (!safeCommands.includes(command)) {
      throw new Error('Git command not allowed');
    }
        
    return ipcRenderer.invoke('git-command', command, options);
  },

  // === SYSTEM INTEGRATION ===
    
  // Open system terminal
  openTerminal: () => ipcRenderer.invoke('open-terminal'),
    
  // Start Claude session
  startClaudeSession: () => ipcRenderer.invoke('start-claude-session'),
    
  // === SETTINGS MANAGEMENT ===
    
  // Get application settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
    
  // Save application settings
  saveSettings: (settings) => {
    // Validate settings object
    if (typeof settings !== 'object' || settings === null) {
      throw new Error('Invalid settings object');
    }
        
    // Sanitize settings
    const sanitizedSettings = {
      cleanupDays: Math.max(1, Math.min(30, parseInt(settings.cleanupDays) || 7)),
      darkMode: Boolean(settings.darkMode)
    };
        
    return ipcRenderer.invoke('save-settings', sanitizedSettings);
  },

  // === APP INFORMATION ===
    
  // Get application information
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // === EVENT HANDLING ===
    
  // Menu action handler
  onMenuAction: (callback) => {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    return ipcRenderer.on('menu-action', callback);
  },
    
  // Project folder selection handler
  onProjectFolderSelected: (callback) => {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    return ipcRenderer.on('project-folder-selected', callback);
  },
    
  // App focus handler
  onAppFocused: (callback) => {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    return ipcRenderer.on('app-focused', callback);
  },
    
  // App blur handler
  onAppBlurred: (callback) => {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    return ipcRenderer.on('app-blurred', callback);
  },
    
  // System theme change handler
  onSystemThemeChanged: (callback) => {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    return ipcRenderer.on('system-theme-changed', callback);
  },

  // === UTILITY FUNCTIONS ===
    
  // Remove event listeners (memory management)
  removeAllListeners: (channel) => {
    const allowedChannels = [
      'menu-action',
      'project-folder-selected',
      'app-focused',
      'app-blurred',
      'system-theme-changed'
    ];
        
    if (allowedChannels.includes(channel)) {
      return ipcRenderer.removeAllListeners(channel);
    }
  },
    
  // Check if running in development mode
  isDevelopment: () => process.env.NODE_ENV === 'development',
    
  // Get platform information
  getPlatform: () => ({
    os: process.platform,
    arch: process.arch,
    versions: {
      node: process.versions.node,
      electron: process.versions.electron
    }
  })
});

// === SECURITY ENHANCEMENTS ===

// Prevent context isolation bypass
window.addEventListener('DOMContentLoaded', () => {
  // Remove any potential Node.js globals that might leak through
  delete window.global;
  delete window.Buffer;
  delete window.process;
    
  // Freeze the electronAPI to prevent tampering
  if (window.electronAPI) {
    Object.freeze(window.electronAPI);
  }
});

// === PERFORMANCE OPTIMIZATION ===

// Preload critical resources
document.addEventListener('DOMContentLoaded', () => {
  // Prefetch app info for faster initial load
  if (window.electronAPI) {
    window.electronAPI.getAppInfo().catch(() => {
      // Silently fail if not available
    });
        
    // Prefetch settings
    window.electronAPI.getSettings().catch(() => {
      // Silently fail if not available
    });
  }
});

// === ERROR HANDLING ===

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default browser behavior
  event.preventDefault();
});

// Global error handler for uncaught exceptions
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});