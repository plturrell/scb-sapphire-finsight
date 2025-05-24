/*
 * FinSight Desktop Icon Generator
 * Creates beautiful Jony Ive-inspired icons for all platforms
 */

const fs = require('fs');
const path = require('path');

// Create SVG icon with Jony Ive design principles
function createFinSightIcon() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradient definitions for depth and materiality -->
    <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#007AFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0051D5;stop-opacity:1" />
    </linearGradient>
    
    <linearGradient id="symbolGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.95" />
      <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:0.85" />
    </linearGradient>
    
    <!-- Shadow filters for depth -->
    <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.15"/>
    </filter>
    
    <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feOffset dx="0" dy="2"/>
      <feGaussianBlur stdDeviation="3" result="offset-blur"/>
      <feFlood flood-color="#000000" flood-opacity="0.1"/>
      <feComposite in2="offset-blur" operator="in"/>
    </filter>
  </defs>
  
  <!-- App Icon Background - Rounded rectangle with perfect iOS proportions -->
  <rect x="64" y="64" width="896" height="896" rx="200" ry="200" 
        fill="url(#backgroundGradient)" 
        filter="url(#softShadow)"/>
  
  <!-- Financial Graph Symbol - Represents FinSight's analytical nature -->
  <!-- Base chart area -->
  <rect x="200" y="400" width="624" height="300" 
        fill="none" 
        stroke="url(#symbolGradient)" 
        stroke-width="4" 
        opacity="0.3"/>
  
  <!-- Upward trending line - Symbol of growth and insight -->
  <polyline points="200,650 320,580 440,520 560,440 680,380 824,320" 
            fill="none" 
            stroke="url(#symbolGradient)" 
            stroke-width="8" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>
  
  <!-- Data points for precision -->
  <circle cx="200" cy="650" r="8" fill="url(#symbolGradient)"/>
  <circle cx="320" cy="580" r="8" fill="url(#symbolGradient)"/>
  <circle cx="440" cy="520" r="8" fill="url(#symbolGradient)"/>
  <circle cx="560" cy="440" r="8" fill="url(#symbolGradient)"/>
  <circle cx="680" cy="380" r="8" fill="url(#symbolGradient)"/>
  <circle cx="824" cy="320" r="8" fill="url(#symbolGradient)"/>
  
  <!-- Git branch symbol - Subtle representation of version control -->
  <g transform="translate(720, 250)" opacity="0.6">
    <!-- Main branch line -->
    <line x1="0" y1="0" x2="0" y2="80" 
          stroke="url(#symbolGradient)" 
          stroke-width="4" 
          stroke-linecap="round"/>
    
    <!-- Feature branch -->
    <path d="M 0 20 Q 20 20 20 40 L 20 60" 
          fill="none" 
          stroke="url(#symbolGradient)" 
          stroke-width="4" 
          stroke-linecap="round"/>
    
    <!-- Merge point -->
    <path d="M 20 60 Q 20 80 0 80" 
          fill="none" 
          stroke="url(#symbolGradient)" 
          stroke-width="4" 
          stroke-linecap="round"/>
    
    <!-- Branch nodes -->
    <circle cx="0" cy="0" r="6" fill="url(#symbolGradient)"/>
    <circle cx="20" cy="40" r="6" fill="url(#symbolGradient)"/>
    <circle cx="0" cy="80" r="6" fill="url(#symbolGradient)"/>
  </g>
  
  <!-- Insight symbol - Lightbulb representing intelligence -->
  <g transform="translate(280, 250)" opacity="0.7">
    <!-- Bulb shape -->
    <ellipse cx="0" cy="-10" rx="25" ry="35" fill="url(#symbolGradient)"/>
    
    <!-- Base -->
    <rect x="-15" y="15" width="30" height="20" rx="3" fill="url(#symbolGradient)"/>
    
    <!-- Insight rays -->
    <g stroke="url(#symbolGradient)" stroke-width="3" stroke-linecap="round" opacity="0.8">
      <line x1="-40" y1="-30" x2="-50" y2="-40"/>
      <line x1="40" y1="-30" x2="50" y2="-40"/>
      <line x1="-45" y1="0" x2="-55" y2="0"/>
      <line x1="45" y1="0" x2="55" y2="0"/>
      <line x1="-35" y1="25" x2="-45" y2="35"/>
      <line x1="35" y1="25" x2="45" y2="35"/>
    </g>
  </g>
  
  <!-- Subtle highlight for iOS-style depth -->
  <ellipse cx="350" cy="200" rx="120" ry="40" 
           fill="url(#symbolGradient)" 
           opacity="0.1" 
           transform="rotate(-15 350 200)"/>
</svg>`;
}

// Create PNG at different sizes for iconset
function createIconScript() {
  return `#!/bin/bash

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
`;
}

// Write the SVG icon
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.svg'), createFinSightIcon());

// Write the icon generation script
fs.writeFileSync(path.join(__dirname, 'create-icons.sh'), createIconScript());
fs.chmodSync(path.join(__dirname, 'create-icons.sh'), '755');

console.log('✨ FinSight icon files created!');
console.log('🚀 Run ./create-icons.sh to generate all platform icons');