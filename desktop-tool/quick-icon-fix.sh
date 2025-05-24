#!/bin/bash

# Quick FinSight Icon Fix
# Creates working icons for immediate use

echo "🔧 Quick FinSight Icon Fix..."

cd "$(dirname "$0")"

# Create directories
mkdir -p assets/iconset
mkdir -p assets/temp

# Create a simple but beautiful icon using pure system tools
# We'll create a 1024x1024 base icon using a simple geometric approach

# Create base icon data (blue square with white elements)
cat > assets/temp/create_base_icon.py << 'EOF'
#!/usr/bin/env python3
import sys

def create_svg_icon():
    return '''<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#007AFF"/>
      <stop offset="100%" style="stop-color:#0051D5"/>
    </linearGradient>
  </defs>
  
  <!-- iOS-style rounded rectangle -->
  <rect x="64" y="64" width="896" height="896" rx="180" ry="180" fill="url(#bg)"/>
  
  <!-- FinSight "F" with chart elements -->
  <g fill="white" opacity="0.95">
    <!-- Letter F structure -->
    <rect x="280" y="300" width="120" height="60"/>
    <rect x="280" y="300" width="60" height="424"/>
    <rect x="280" y="480" width="100" height="60"/>
    
    <!-- Chart elements -->
    <rect x="500" y="600" width="40" height="124"/>
    <rect x="560" y="550" width="40" height="174"/>
    <rect x="620" y="500" width="40" height="224"/>
    <rect x="680" y="450" width="40" height="274"/>
    
    <!-- Connecting line -->
    <path d="M520 600 L580 550 L640 500 L700 450" stroke="white" stroke-width="8" fill="none" opacity="0.8"/>
  </g>
</svg>'''

with open('../icon.svg', 'w') as f:
    f.write(create_svg_icon())

print("✅ Base SVG icon created")
EOF

# Run the Python script to create the SVG
python3 assets/temp/create_base_icon.py

# Check if we have any conversion tools available
if command -v rsvg-convert &> /dev/null; then
    echo "📱 Using rsvg-convert for icon generation..."
    
    # Generate all required sizes
    rsvg-convert -w 16 -h 16 assets/icon.svg > assets/iconset/icon_16x16.png
    rsvg-convert -w 32 -h 32 assets/icon.svg > assets/iconset/icon_16x16@2x.png
    rsvg-convert -w 32 -h 32 assets/icon.svg > assets/iconset/icon_32x32.png
    rsvg-convert -w 64 -h 64 assets/icon.svg > assets/iconset/icon_32x32@2x.png
    rsvg-convert -w 128 -h 128 assets/icon.svg > assets/iconset/icon_128x128.png
    rsvg-convert -w 256 -h 256 assets/icon.svg > assets/iconset/icon_128x128@2x.png
    rsvg-convert -w 256 -h 256 assets/icon.svg > assets/iconset/icon_256x256.png
    rsvg-convert -w 512 -h 512 assets/icon.svg > assets/iconset/icon_256x256@2x.png
    rsvg-convert -w 512 -h 512 assets/icon.svg > assets/iconset/icon_512x512.png
    rsvg-convert -w 1024 -h 1024 assets/icon.svg > assets/iconset/icon_512x512@2x.png
    
    # Create .icns file
    if command -v iconutil &> /dev/null; then
        echo "📦 Creating .icns file..."
        iconutil -c icns assets/iconset -o assets/icon.icns
        echo "✅ macOS icon (.icns) created successfully!"
    fi
    
elif command -v qlmanage &> /dev/null; then
    echo "🍎 Using macOS qlmanage for icon generation..."
    
    # Generate base 1024px icon
    qlmanage -t -s 1024 -o assets/temp assets/icon.svg
    
    # Rename the generated file
    if [ -f "assets/temp/icon.svg.png" ]; then
        mv "assets/temp/icon.svg.png" "assets/temp/icon_1024.png"
        
        # Use sips to create all sizes from the PNG
        sips -z 16 16 assets/temp/icon_1024.png --out assets/iconset/icon_16x16.png
        sips -z 32 32 assets/temp/icon_1024.png --out assets/iconset/icon_16x16@2x.png
        sips -z 32 32 assets/temp/icon_1024.png --out assets/iconset/icon_32x32.png
        sips -z 64 64 assets/temp/icon_1024.png --out assets/iconset/icon_32x32@2x.png
        sips -z 128 128 assets/temp/icon_1024.png --out assets/iconset/icon_128x128.png
        sips -z 256 256 assets/temp/icon_1024.png --out assets/iconset/icon_128x128@2x.png
        sips -z 256 256 assets/temp/icon_1024.png --out assets/iconset/icon_256x256.png
        sips -z 512 512 assets/temp/icon_1024.png --out assets/iconset/icon_256x256@2x.png
        sips -z 512 512 assets/temp/icon_1024.png --out assets/iconset/icon_512x512.png
        sips -z 1024 1024 assets/temp/icon_1024.png --out assets/iconset/icon_512x512@2x.png
        
        # Create .icns file
        echo "📦 Creating .icns file..."
        iconutil -c icns assets/iconset -o assets/icon.icns
        echo "✅ macOS icon (.icns) created successfully!"
        
        # Copy main icon files
        cp assets/temp/icon_1024.png assets/icon.png
    fi
    
else
    echo "⚠️ No suitable conversion tool found"
    echo "📝 Manual steps:"
    echo "1. Open assets/icon.svg in any graphics application"
    echo "2. Export as PNG at 1024x1024 pixels"
    echo "3. Save as assets/icon.png"
    echo "4. Run this script again to generate all sizes"
fi

# Create basic fallback icons if none exist
if [ ! -f "assets/icon.png" ]; then
    echo "🎨 Creating fallback icon..."
    
    # Create a simple text-based icon using ImageMagick if available
    if command -v convert &> /dev/null; then
        convert -size 1024x1024 xc:"#007AFF" -font Arial-Bold -pointsize 200 -fill white -gravity center -annotate +0+0 "F" assets/icon.png
        echo "✅ Fallback icon created"
    fi
fi

# Cleanup
rm -rf assets/temp

echo "🎯 FinSight icons ready!"
echo "📁 Check assets/icon.icns for macOS app icon"

# Test if the app can now see the icon
echo "🧪 Testing icon integration..."
if [ -f "assets/icon.icns" ]; then
    echo "✅ macOS icon file exists"
    ls -la assets/icon.icns
else
    echo "❌ macOS icon file missing"
fi