#!/bin/bash

# FinSight Desktop Development Launcher
# Quick development mode with DevTools

echo "🛠️  FinSight Desktop Development Mode"
echo "   Version 2.0.0 - Jony Ive Design Philosophy"
echo "   DevTools will open automatically"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from desktop-tool directory"
    exit 1
fi

# Launch in development mode
echo "⚡ Starting development server..."
NODE_ENV=development npm run dev