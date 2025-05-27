#!/bin/bash

echo "🧪 Testing FinSight Desktop Real Functionality"
echo "=============================================="

# Test 1: Check git repository connection
echo ""
echo "1️⃣ Testing Git Repository Connection..."
cd /Users/apple/projects/scb-sapphire-finsight
echo "   Current directory: $(pwd)"
echo "   Git status: $(git status --porcelain | wc -l) files changed"
echo "   Current branch: $(git branch --show-current)"
echo "   Available branches:"
git branch --list | head -5

# Test 2: Launch app in test mode
echo ""
echo "2️⃣ Launching FinSight Desktop for Testing..."
cd desktop-tool
echo "   Starting app with development console..."

# Kill any existing electron processes
pkill -f "electron.*desktop-tool" 2>/dev/null || true
sleep 1

# Launch app in background for testing
NODE_ENV=development npm start &
APP_PID=$!

echo "   App launched with PID: $APP_PID"
echo "   Waiting 5 seconds for app to initialize..."
sleep 5

# Test 3: Check if app is running
echo ""
echo "3️⃣ Testing App Status..."
if ps -p $APP_PID > /dev/null; then
    echo "   ✅ App is running successfully"
    echo "   📱 Check the app window for:"
    echo "      - Current branch displayed"
    echo "      - Click 'Switch' to see branch list"
    echo "      - Click status dot for settings panel"
    echo "      - Dark/light mode toggle should work"
else
    echo "   ❌ App failed to start"
fi

echo ""
echo "4️⃣ Manual Testing Instructions:"
echo "   1. Look at the app window"
echo "   2. Current branch should show: claude-work/claude-2025-05-22T16-19-00-1fb0d540"
echo "   3. Click 'Switch' button - should show both 'main' and current Claude branch"
echo "   4. Click status dot (top-right) - settings panel should slide in"
echo "   5. Toggle 'Dark Mode' checkbox - theme should change immediately"
echo "   6. Close settings, click 'Status' - should show real file changes"

echo ""
echo "⏰ App will continue running for testing..."
echo "   Press Ctrl+C to stop this script (app will keep running)"
echo "   Or kill the app with: kill $APP_PID"

# Wait for user to test
wait $APP_PID