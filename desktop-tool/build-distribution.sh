#!/bin/bash

# FinSight Desktop Build Script
# Complete build process for distribution

echo "🔨 Building FinSight Desktop for Distribution"
echo "   Version 2.0.0 - Jony Ive Design Philosophy"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean

# Run quality checks
echo "🔍 Running code quality checks..."
npm run lint
npm test

# Build for current platform
echo "📦 Building application package..."
npm run pack

# Build distributables
echo "🚀 Creating distribution packages..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   Building for macOS..."
    npm run dist:mac
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "   Building for Linux..."
    npm run dist:linux
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "   Building for Windows..."
    npm run dist:win
fi

echo ""
echo "✅ Build Complete!"
echo "   Check the 'dist' folder for distribution packages"
echo "   Application ready for deployment"