/*
 * FinSight Desktop - Jony Ive Design Philosophy
 * Main Process: Elegant System Integration, Purposeful Simplicity
 */

const { app, BrowserWindow, Menu, ipcMain, shell, dialog, nativeTheme } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const Store = require('electron-store');

// Secure store with encryption
const store = new Store({
  encryptionKey: 'finsight-secure-key-2024',
  name: 'finsight-preferences'
});

// FinSight project configuration - purposefully hardcoded for security
const FINSIGHT_PROJECT = {
  path: '/Users/apple/projects/scb-sapphire-finsight',
  name: 'FinSight',
  version: '2.0.0'
};

let mainWindow;
let isDevMode = process.argv.includes('--dev');

// === WINDOW CREATION - MINIMAL ELEGANCE ===
function createWindow() {
  // Window configuration inspired by iOS design principles
  const windowConfig = {
    width: 960,
    height: 720,
    minWidth: 720,
    minHeight: 540,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false, // Required for IPC
      webSecurity: true
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 20, y: 20 } : undefined,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#000000' : '#FFFFFF',
    vibrancy: process.platform === 'darwin' ? 'sidebar' : undefined,
    show: false,
    center: true,
    title: 'FinSight',
    icon: getAppIcon()
  };

  mainWindow = new BrowserWindow(windowConfig);

  // Elegant loading - prevent visual flash
  mainWindow.loadFile('index.html');

  // Graceful window appearance
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
        
    // macOS specific focus behavior
    if (process.platform === 'darwin') {
      mainWindow.focus();
      app.dock.show();
    }
        
    // Gentle entrance animation
    if (!isDevMode) {
      mainWindow.setOpacity(0);
      let opacity = 0;
      const fadeIn = setInterval(() => {
        opacity += 0.05;
        mainWindow.setOpacity(Math.min(opacity, 1));
        if (opacity >= 1) {
          clearInterval(fadeIn);
        }
      }, 16); // 60fps animation
    }
  });

  // Development tools - minimal intrusion
  if (isDevMode) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Secure external link handling
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Window lifecycle
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Dark mode synchronization
  nativeTheme.on('updated', () => {
    if (mainWindow) {
      mainWindow.webContents.send('system-theme-changed', {
        shouldUseDarkColors: nativeTheme.shouldUseDarkColors
      });
    }
  });

  return mainWindow;
}

function getAppIcon() {
  const iconPath = path.join(__dirname, 'assets');
    
  if (process.platform === 'darwin') {
    return path.join(iconPath, 'icon.icns');
  } else if (process.platform === 'win32') {
    return path.join(iconPath, 'icon.ico');
  } else {
    return path.join(iconPath, 'icon.png');
  }
}

// === APP LIFECYCLE - SYSTEM INTEGRATION ===
app.whenReady().then(() => {
  // Set app user model ID for Windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.scb.finsight');
  }

  createWindow();
  createApplicationMenu();
    
  // macOS app activation behavior
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

// Graceful shutdown
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Save window state before quitting
  if (mainWindow) {
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', bounds);
  }
});

// === MENU SYSTEM - PURPOSEFUL HIERARCHY ===
function createApplicationMenu() {
  const isMac = process.platform === 'darwin';
    
  const template = [
    // Application menu (macOS only)
    ...(isMac ? [{
      label: 'FinSight',
      submenu: [
        { 
          label: 'About FinSight',
          click: () => showAboutDialog()
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
          click: () => mainWindow.webContents.send('menu-action', 'preferences')
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Claude Branch',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-action', 'new-branch')
        },
        { type: 'separator' },
        {
          label: 'Refresh Status',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.webContents.send('menu-action', 'refresh-status')
        },
        { type: 'separator' },
        ...(!isMac ? [
          {
            label: 'Preferences...',
            accelerator: 'Ctrl+,',
            click: () => mainWindow.webContents.send('menu-action', 'preferences')
          },
          { type: 'separator' },
          { role: 'quit' }
        ] : [])
      ]
    },

    // Branch menu
    {
      label: 'Branch',
      submenu: [
        {
          label: 'Switch Branch...',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow.webContents.send('menu-action', 'switch-branch')
        },
        {
          label: 'Sync to Local',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-action', 'sync-local')
        },
        { type: 'separator' },
        {
          label: 'Cleanup Old Branches...',
          click: () => mainWindow.webContents.send('menu-action', 'cleanup-branches')
        }
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Status Overview',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow.webContents.send('menu-action', 'show-status')
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function showAboutDialog() {
  const appInfo = await getAppInfo();
    
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'About FinSight',
    message: 'FinSight Git Manager',
    detail: `Version ${appInfo.version}\nBuilt with Electron ${appInfo.electronVersion}\n\nA desktop tool for managing Claude branches in the SCB Sapphire FinSight project.`,
    buttons: ['OK']
  });
}

// === IPC HANDLERS - SECURE COMMUNICATION ===

// Git operations - scoped to FinSight project
ipcMain.handle('git-command', async (_, command, options = {}) => {
  return executeSecureCommand('git', [command], {
    cwd: FINSIGHT_PROJECT.path,
    ...options
  });
});

ipcMain.handle('create-claude-branch', async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const branchName = `claude-work/${timestamp}`;
        
    const result = await executeSecureCommand('git', [
      'checkout', '-b', branchName
    ], { cwd: FINSIGHT_PROJECT.path });
        
    if (result.success) {
      // Store branch creation in preferences
      const branches = store.get('claudeBranches', []);
      branches.unshift({
        name: branchName,
        created: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      });
      store.set('claudeBranches', branches.slice(0, 50)); // Keep last 50 branches
    }
        
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('switch-branch', async (_, branchName) => {
  try {
    const result = await executeSecureCommand('git', [
      'checkout', branchName
    ], { cwd: FINSIGHT_PROJECT.path });
        
    if (result.success) {
      // Update last accessed time
      const branches = store.get('claudeBranches', []);
      const branch = branches.find(b => b.name === branchName);
      if (branch) {
        branch.lastAccessed = new Date().toISOString();
        store.set('claudeBranches', branches);
      }
    }
        
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sync-to-local', async () => {
  try {
    // Add all changes
    await executeSecureCommand('git', ['add', '.'], { 
      cwd: FINSIGHT_PROJECT.path 
    });
        
    // Commit with timestamp
    const timestamp = new Date().toLocaleString();
    const result = await executeSecureCommand('git', [
      'commit', '-m', `Auto-sync: ${timestamp}`
    ], { cwd: FINSIGHT_PROJECT.path });
        
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cleanup-branches', async (_, days = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
        
    const branches = store.get('claudeBranches', []);
    const oldBranches = branches.filter(b => 
      new Date(b.lastAccessed) < cutoffDate
    );
        
    let cleanedCount = 0;
    for (const branch of oldBranches) {
      try {
        await executeSecureCommand('git', [
          'branch', '-D', branch.name
        ], { cwd: FINSIGHT_PROJECT.path });
        cleanedCount++;
      } catch (error) {
        // Branch might not exist, ignore error
      }
    }
        
    // Update stored branches
    const remainingBranches = branches.filter(b => 
      new Date(b.lastAccessed) >= cutoffDate
    );
    store.set('claudeBranches', remainingBranches);
        
    return { 
      success: true, 
      message: `Cleaned ${cleanedCount} old branches` 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-project-status', async () => {
  try {
    const statusResult = await executeSecureCommand('git', [
      'status', '--porcelain'
    ], { cwd: FINSIGHT_PROJECT.path });
        
    const branchResult = await executeSecureCommand('git', [
      'branch', '--show-current'
    ], { cwd: FINSIGHT_PROJECT.path });
        
    return {
      success: true,
      connected: true,
      currentBranch: branchResult.stdout.trim(),
      hasChanges: statusResult.stdout.trim().length > 0,
      changeCount: statusResult.stdout.trim().split('\n').filter(l => l).length
    };
  } catch (error) {
    return { 
      success: false, 
      connected: false, 
      error: error.message 
    };
  }
});

ipcMain.handle('get-claude-branches', async () => {
  try {
    const result = await executeSecureCommand('git', [
      'branch', '--list', 'claude-work/*'
    ], { cwd: FINSIGHT_PROJECT.path });
        
    if (result.success) {
      const branches = result.stdout
        .split('\n')
        .map(line => line.trim().replace(/^\* /, ''))
        .filter(line => line && line.startsWith('claude-work/'));
            
      return { success: true, branches };
    }
        
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Settings management
ipcMain.handle('get-settings', () => {
  return store.get('settings', {
    cleanupDays: 7,
    darkMode: nativeTheme.shouldUseDarkColors
  });
});

ipcMain.handle('save-settings', (_, settings) => {
  store.set('settings', settings);
  return { success: true };
});

// System integration
ipcMain.handle('open-terminal', async () => {
  return openSystemTerminal(FINSIGHT_PROJECT.path);
});

ipcMain.handle('start-claude-session', async () => {
  try {
    // Launch Claude Code in FinSight project
    await executeSecureCommand('claude', [], {
      cwd: FINSIGHT_PROJECT.path,
      detached: true
    });
        
    return { success: true, message: 'Claude session started' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// App information
ipcMain.handle('get-app-info', () => {
  return getAppInfo();
});

// === UTILITY FUNCTIONS ===

async function executeSecureCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd || FINSIGHT_PROJECT.path,
      stdio: 'pipe',
      env: { ...process.env, ...options.env },
      shell: false // Security: disable shell execution
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    child.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    // Security timeout
    setTimeout(() => {
      child.kill();
      resolve({
        success: false,
        error: 'Command timeout'
      });
    }, 30000); // 30 second timeout
  });
}

async function openSystemTerminal(cwd) {
  try {
    const platform = process.platform;
        
    if (platform === 'darwin') {
      // macOS - use Terminal.app
      await executeSecureCommand('open', ['-a', 'Terminal', cwd]);
    } else if (platform === 'win32') {
      // Windows - use PowerShell
      await executeSecureCommand('powershell', ['-Command', `cd '${cwd}'; powershell`]);
    } else {
      // Linux - try various terminals
      const terminals = ['gnome-terminal', 'konsole', 'xterm'];
      for (const terminal of terminals) {
        try {
          await executeSecureCommand(terminal, [`--working-directory=${cwd}`]);
          break;
        } catch (error) {
          // Try next terminal
        }
      }
    }
        
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getAppInfo() {
  return {
    name: FINSIGHT_PROJECT.name,
    version: FINSIGHT_PROJECT.version,
    platform: process.platform,
    arch: process.arch,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    projectPath: FINSIGHT_PROJECT.path
  };
}

// === EVENT HANDLERS ===

// Focus/blur events for UI updates
app.on('browser-window-focus', () => {
  if (mainWindow) {
    mainWindow.webContents.send('app-focused');
  }
});

app.on('browser-window-blur', () => {
  if (mainWindow) {
    mainWindow.webContents.send('app-blurred');
  }
});

// Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
        
    if (parsedUrl.origin !== 'file://') {
      navigationEvent.preventDefault();
    }
  });
});

// Security: prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});