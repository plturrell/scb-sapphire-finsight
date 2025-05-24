#!/bin/bash

# FinSight Desktop Launcher
# Easy launch script for FinSight Git Manager

echo "🚀 Starting FinSight Desktop Git Manager..."
echo "   Version 2.0.0 - Jony Ive Design Philosophy"
echo ""

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

# Launch the application
echo "✨ Launching FinSight Desktop..."
npm start