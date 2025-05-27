#!/bin/bash

# FinSight Desktop App Launcher
# Professional Git Management Tool with Jony Ive Design Standards

echo "🚀 Launching FinSight Git Management Tool..."
echo "   Version 2.0.0 - Jony Ive Design Philosophy"
echo ""

# Option 1: Launch from Applications (preferred)
if [ -d "/Applications/FinSight.app" ]; then
    echo "📱 Launching from Applications folder..."
    open /Applications/FinSight.app
    echo "✅ FinSight launched successfully!"
    echo "🎨 Enjoy the Jony Ive-inspired interface with real git functionality!"
    exit 0
fi

# Option 2: Launch from local build
if [ -d "dist/mac/FinSight.app" ]; then
    echo "🔨 Launching from local build..."
    open dist/mac/FinSight.app
    echo "✅ FinSight launched successfully!"
    exit 0
fi

# Option 3: Launch from ARM64 build
if [ -d "dist/mac-arm64/FinSight.app" ]; then
    echo "🔨 Launching from ARM64 build..."
    open dist/mac-arm64/FinSight.app
    echo "✅ FinSight launched successfully!"
    exit 0
fi

# Option 4: Development mode (fallback)
echo "📦 No app bundle found. Launching in development mode..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from desktop-tool directory"
    echo "   cd /Users/apple/projects/scb-sapphire-finsight/desktop-tool"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Launch the application in development
echo "✨ Launching FinSight Desktop in dev mode..."
npm start