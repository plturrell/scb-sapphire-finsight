#!/bin/bash

# Create Desktop Shortcut for FinSight Desktop
echo "🖥️  Creating Desktop Shortcut for FinSight..."

# Path to the built app
APP_PATH="/Users/apple/projects/scb-sapphire-finsight/desktop-tool/dist/mac-arm64/FinSight.app"
DESKTOP_PATH="/Users/apple/Desktop"

# Check if app exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ App not found at $APP_PATH"
    echo "   Building app first..."
    cd /Users/apple/projects/scb-sapphire-finsight/desktop-tool
    npm run pack
fi

# Create alias on desktop
if [ -d "$APP_PATH" ]; then
    echo "📱 Creating desktop alias..."
    ln -sf "$APP_PATH" "$DESKTOP_PATH/FinSight.app"
    echo "✅ Desktop shortcut created: $DESKTOP_PATH/FinSight.app"
    
    # Make it executable
    chmod +x "$DESKTOP_PATH/FinSight.app"
    
    echo ""
    echo "🚀 FinSight Desktop is now available on your desktop!"
    echo "   Double-click FinSight.app to launch"
else
    echo "❌ Failed to create desktop shortcut"
fi