#!/bin/bash

echo "🔍 Looking for FinSight Desktop app..."

# Check if app is running
PID=$(ps aux | grep "electron.*finsight\|Electron.*FinSight" | grep -v grep | awk '{print $2}')

if [ -n "$PID" ]; then
    echo "✅ FinSight app is running with PID: $PID"
    
    # Try to bring app to front using AppleScript
    osascript << EOF
tell application "System Events"
    set appName to "Electron"
    if exists (processes whose name is appName) then
        tell application appName to activate
        return "App brought to front"
    else
        return "App not found in process list"
    end if
end tell
EOF
    
    echo "📱 App should now be visible. If not:"
    echo "   - Try pressing Cmd+Tab to cycle through apps"
    echo "   - Look for FinSight icon in the Dock"
    echo "   - Check if window is minimized"
    
else
    echo "❌ FinSight app is not running"
    echo "🚀 Starting FinSight Desktop..."
    cd "$(dirname "$0")"
    npm start &
    echo "⏳ App starting... window should appear in 2-3 seconds"
fi