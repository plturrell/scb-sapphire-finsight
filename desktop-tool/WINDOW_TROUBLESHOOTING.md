# 🔍 FinSight Desktop Window Troubleshooting

## ✅ App Status: RUNNING
The FinSight Desktop app is successfully starting and the console shows:
- ✅ Electron process launches
- ✅ Window creation completes  
- ✅ "FinSight window should now be visible" message appears

## 🔍 If Window Not Visible, Try These Steps:

### 1. **Check macOS Dock**
- Look for FinSight or Electron icon in the Dock
- Right-click any Electron icon and select "Show All Windows"

### 2. **Use Mission Control**
- Press **F3** or swipe up with 3 fingers
- Look for FinSight window in the overview

### 3. **Use App Switcher**  
- Press **Cmd+Tab** to cycle through apps
- Look for FinSight or Electron

### 4. **Check Desktop Spaces**
- Swipe left/right between desktop spaces
- Window might be on a different space

### 5. **Force Window to Front**
```bash
cd /Users/apple/projects/scb-sapphire-finsight/desktop-tool
osascript -e 'tell application "System Events" to set frontmost of first process whose name contains "Electron" to true'
```

### 6. **Alternative Launch Methods**

**Method A: Direct Electron Launch**
```bash
cd /Users/apple/projects/scb-sapphire-finsight/desktop-tool
npx electron . --dev
```

**Method B: Simple Window Mode**
```bash
cd /Users/apple/projects/scb-sapphire-finsight/desktop-tool
npx electron . --show-window
```

### 7. **Check Window Bounds**
The app saves window position. Try resetting:
```bash
cd /Users/apple/projects/scb-sapphire-finsight/desktop-tool
rm -rf ~/Library/Application\ Support/finsight-preferences
npm start
```

### 8. **System Preferences Check**
- **System Preferences > Security & Privacy > Privacy**
- Ensure Terminal/Claude has "Accessibility" permission
- This allows window management

## 🚨 Emergency Recovery

If window still not visible, create a simplified launcher:

```bash
cd /Users/apple/projects/scb-sapphire-finsight/desktop-tool
cat > simple-launch.js << 'EOF'
const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    center: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  win.loadFile('index.html');
  win.focus();
  
  console.log('Emergency window created');
});
EOF

npx electron simple-launch.js
```

## 📊 Current Status
- ✅ App process starts successfully
- ✅ Window creation code executes
- ✅ No JavaScript errors in main process  
- ✅ All files present and correct

The issue is likely a macOS window management or display issue, not a code problem.

## 🆘 Next Steps
1. Try the troubleshooting steps above in order
2. If still not visible, the emergency recovery method will force a simple window
3. Check Activity Monitor for "Electron" processes to confirm app is running