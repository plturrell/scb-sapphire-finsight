#!/bin/bash

# FinSight Desktop Icon Creation Script
# Creates all required icon sizes for macOS, Windows, and Linux

echo "🎨 Creating FinSight Desktop icons..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Create directories
mkdir -p assets/iconset
mkdir -p assets/windows
mkdir -p assets/linux

# Create the base SVG icon
echo "✨ Generating base SVG icon..."
node create-icons.js

# macOS iconset creation (requires ImageMagick or sips)
echo "🍎 Creating macOS icons..."

# Check if we have sips (built into macOS)
if command -v sips &> /dev/null; then
    echo "Using sips for macOS icon generation..."
    
    # Generate all required sizes for macOS
    sips -z 16 16 assets/icon.svg --out assets/iconset/icon_16x16.png
    sips -z 32 32 assets/icon.svg --out assets/iconset/icon_16x16@2x.png
    sips -z 32 32 assets/icon.svg --out assets/iconset/icon_32x32.png
    sips -z 64 64 assets/icon.svg --out assets/iconset/icon_32x32@2x.png
    sips -z 128 128 assets/icon.svg --out assets/iconset/icon_128x128.png
    sips -z 256 256 assets/icon.svg --out assets/iconset/icon_128x128@2x.png
    sips -z 256 256 assets/icon.svg --out assets/iconset/icon_256x256.png
    sips -z 512 512 assets/icon.svg --out assets/iconset/icon_256x256@2x.png
    sips -z 512 512 assets/icon.svg --out assets/iconset/icon_512x512.png
    sips -z 1024 1024 assets/icon.svg --out assets/iconset/icon_512x512@2x.png
    
    # Create .icns file
    echo "📦 Creating .icns file..."
    iconutil -c icns assets/iconset -o assets/icon.icns
    
elif command -v convert &> /dev/null; then
    echo "Using ImageMagick for icon generation..."
    
    # Generate all required sizes
    convert assets/icon.svg -resize 16x16 assets/iconset/icon_16x16.png
    convert assets/icon.svg -resize 32x32 assets/iconset/icon_16x16@2x.png
    convert assets/icon.svg -resize 32x32 assets/iconset/icon_32x32.png
    convert assets/icon.svg -resize 64x64 assets/iconset/icon_32x32@2x.png
    convert assets/icon.svg -resize 128x128 assets/iconset/icon_128x128.png
    convert assets/icon.svg -resize 256x256 assets/iconset/icon_128x128@2x.png
    convert assets/icon.svg -resize 256x256 assets/iconset/icon_256x256.png
    convert assets/icon.svg -resize 512x512 assets/iconset/icon_256x256@2x.png
    convert assets/icon.svg -resize 512x512 assets/iconset/icon_512x512.png
    convert assets/icon.svg -resize 1024x1024 assets/iconset/icon_512x512@2x.png
    
    # Create .icns file
    echo "📦 Creating .icns file..."
    iconutil -c icns assets/iconset -o assets/icon.icns
    
else
    echo "⚠️  Warning: Neither sips nor ImageMagick found. Please install ImageMagick to generate icons."
    echo "   brew install imagemagick"
fi

# Windows icon creation
echo "🪟 Creating Windows icon..."
if command -v convert &> /dev/null; then
    convert assets/icon.svg -resize 256x256 assets/windows/icon.ico
    cp assets/windows/icon.ico assets/icon.ico
else
    echo "⚠️  Warning: ImageMagick needed for Windows icon generation"
fi

# Linux icon creation
echo "🐧 Creating Linux icon..."
if command -v convert &> /dev/null; then
    convert assets/icon.svg -resize 256x256 assets/linux/icon.png
    cp assets/linux/icon.png assets/icon.png
else
    echo "⚠️  Warning: ImageMagick needed for Linux icon generation"
fi

echo "✅ Icon creation complete!"
echo "📁 Generated files:"
echo "   - assets/icon.icns (macOS)"
echo "   - assets/icon.ico (Windows)"  
echo "   - assets/icon.png (Linux)"
echo "   - assets/iconset/ (All macOS sizes)"

# Cleanup
# rm -f assets/icon.svg  # Keep SVG for future regeneration

echo "🎯 Icons ready for FinSight Desktop!"
