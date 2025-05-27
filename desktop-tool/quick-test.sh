#!/bin/bash

echo "🧪 FinSight Desktop - Quick Functionality Test"
echo "=============================================="

# Kill any existing processes
pkill -f "electron.*finsight" 2>/dev/null || true
pkill -f "Electron.*FinSight" 2>/dev/null || true

echo "1️⃣ Verifying file integrity..."

# Check key files exist
if [ -f "index.html" ] && [ -f "style.css" ] && [ -f "renderer.js" ] && [ -f "main.js" ] && [ -f "preload.js" ]; then
    echo "   ✅ All core files present"
else
    echo "   ❌ Missing core files"
    exit 1
fi

echo "2️⃣ Checking git repository..."
cd /Users/apple/projects/scb-sapphire-finsight
if git status >/dev/null 2>&1; then
    echo "   ✅ Git repository accessible"
    echo "   📌 Current branch: $(git branch --show-current)"
    echo "   📌 Available branches:"
    git branch | sed 's/^/      /'
else
    echo "   ❌ Git repository not accessible"
fi

echo "3️⃣ Starting FinSight Desktop..."
cd /Users/apple/projects/scb-sapphire-finsight/desktop-tool

# Start the app in background
npm start &
APP_PID=$!

echo "   🚀 App started with PID: $APP_PID"
echo "   ⏳ Waiting 3 seconds for initialization..."
sleep 3

# Check if app is still running
if kill -0 $APP_PID 2>/dev/null; then
    echo "   ✅ App is running successfully!"
    echo ""
    echo "📱 MANUAL TEST INSTRUCTIONS:"
    echo "   1. Look for the FinSight app window"
    echo "   2. You should see an authentic macOS interface"
    echo "   3. Check if current branch is displayed in sidebar"
    echo "   4. Try clicking on different branches"
    echo "   5. Click 'Switch' button to test branch switching"
    echo "   6. Click 'Launch Claude' to test Claude Code integration"
    echo ""
    echo "🔧 If something doesn't work:"
    echo "   - Try running: npm start -- --dev (for console errors)"
    echo "   - Check if you can see branch names in the sidebar"
    echo "   - Look for any JavaScript errors in DevTools"
    echo ""
    echo "⏹️  To stop the app: kill $APP_PID"
else
    echo "   ❌ App failed to start"
    exit 1
fi