#!/bin/bash

# Create macOS App Bundle for Claude Git Manager
# This script creates a proper .app bundle that can be saved to desktop

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
APP_NAME="Claude Git Manager"
APP_BUNDLE_NAME="Claude Git Manager.app"
DESKTOP_PATH="$HOME/Desktop"
BUILD_DIR="$SCRIPT_DIR/build"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[MAC-APP]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're on macOS
check_macos() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        error "This script only works on macOS"
        exit 1
    fi
    success "macOS detected"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    cd "$SCRIPT_DIR"
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Install electron-builder if not present
    if ! npm list electron-builder >/dev/null 2>&1; then
        log "Installing electron-builder..."
        npm install --save-dev electron-builder
    fi
    
    success "Dependencies installed"
}

# Create app icon
create_app_icon() {
    log "Creating app icon..."
    
    # Create iconset directory
    mkdir -p "$SCRIPT_DIR/assets/icon.iconset"
    
    # Create a simple SVG icon if it doesn't exist
    if [ ! -f "$SCRIPT_DIR/assets/icon.svg" ]; then
        cat > "$SCRIPT_DIR/assets/icon.svg" << 'EOF'
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="url(#grad1)" stroke="#ffffff" stroke-width="8"/>
  
  <!-- Git branch icon -->
  <g transform="translate(256,256)" stroke="#ffffff" stroke-width="12" fill="none">
    <!-- Main branch -->
    <path d="M-80,-120 Q-80,-80 -40,-80 L40,-80 Q80,-80 80,-40 L80,40 Q80,80 40,80 L-40,80 Q-80,80 -80,120" stroke-linecap="round"/>
    
    <!-- Branch nodes -->
    <circle cx="-80" cy="-120" r="16" fill="#ffffff"/>
    <circle cx="80" cy="-40" r="16" fill="#ffffff"/>
    <circle cx="-80" cy="120" r="16" fill="#ffffff"/>
    
    <!-- Claude symbol -->
    <text x="0" y="15" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff">C</text>
  </g>
  
  <!-- Version indicator -->
  <circle cx="432" cy="80" r="32" fill="#21AA47"/>
  <text x="432" y="88" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">1</text>
</svg>
EOF
    fi
    
    # Convert SVG to PNG at different sizes using built-in tools
    if command -v rsvg-convert >/dev/null 2>&1; then
        # Use rsvg-convert if available
        for size in 16 32 128 256 512; do
            rsvg-convert -w $size -h $size "$SCRIPT_DIR/assets/icon.svg" > "$SCRIPT_DIR/assets/icon.iconset/icon_${size}x${size}.png"
            if [ $size -le 256 ]; then
                rsvg-convert -w $((size*2)) -h $((size*2)) "$SCRIPT_DIR/assets/icon.svg" > "$SCRIPT_DIR/assets/icon.iconset/icon_${size}x${size}@2x.png"
            fi
        done
    elif command -v qlmanage >/dev/null 2>&1; then
        # Use qlmanage (macOS built-in)
        log "Using qlmanage to convert SVG..."
        cp "$SCRIPT_DIR/assets/icon.svg" "/tmp/claude-icon.svg"
        
        # Create different sizes
        for size in 16 32 128 256 512; do
            # Use sips to resize (macOS built-in)
            qlmanage -t -s $size -o "/tmp/" "/tmp/claude-icon.svg" >/dev/null 2>&1 || true
            if [ -f "/tmp/claude-icon.svg.png" ]; then
                cp "/tmp/claude-icon.svg.png" "$SCRIPT_DIR/assets/icon.iconset/icon_${size}x${size}.png"
                if [ $size -le 256 ]; then
                    sips -z $((size*2)) $((size*2)) "/tmp/claude-icon.svg.png" --out "$SCRIPT_DIR/assets/icon.iconset/icon_${size}x${size}@2x.png" >/dev/null 2>&1 || true
                fi
            fi
        done
        rm -f "/tmp/claude-icon.svg" "/tmp/claude-icon.svg.png"
    else
        warn "No SVG converter found. Using default Electron icon."
        # Create a simple fallback
        mkdir -p "$SCRIPT_DIR/assets"
        echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > "$SCRIPT_DIR/assets/icon.png"
        return
    fi
    
    # Convert iconset to icns
    if [ -d "$SCRIPT_DIR/assets/icon.iconset" ]; then
        iconutil -c icns "$SCRIPT_DIR/assets/icon.iconset" -o "$SCRIPT_DIR/assets/icon.icns"
        success "App icon created"
    fi
}

# Update package.json for macOS build
update_package_json() {
    log "Updating package.json for macOS build..."
    
    # Create a temporary package.json with macOS-specific build config
    cat > "$SCRIPT_DIR/package-build.json" << EOF
{
  "name": "claude-git-desktop",
  "version": "1.0.0",
  "description": "Claude Git Branch Manager - Desktop Tool",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev",
    "build": "electron-builder",
    "build-mac": "electron-builder --mac",
    "pack": "electron-builder --dir"
  },
  "build": {
    "appId": "com.scb.claude-git-desktop",
    "productName": "Claude Git Manager",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "renderer.js",
      "style.css",
      "index.html",
      "preload.js",
      "assets/**/*"
    ],
    "mac": {
      "target": {
        "target": "default",
        "arch": ["x64", "arm64"]
      },
      "category": "public.app-category.developer-tools",
      "icon": "assets/icon.icns",
      "bundleVersion": "1.0.0",
      "minimumSystemVersion": "10.14.0"
    }
  },
  "keywords": [
    "electron",
    "claude",
    "git",
    "branch",
    "manager",
    "desktop"
  ],
  "author": "SCB Sapphire Finsight",
  "license": "MIT",
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0"
  },
  "dependencies": {
    "electron-store": "^8.1.0"
  }
}
EOF
    
    # Backup original and use build version
    if [ -f "$SCRIPT_DIR/package.json" ]; then
        cp "$SCRIPT_DIR/package.json" "$SCRIPT_DIR/package.json.backup"
    fi
    cp "$SCRIPT_DIR/package-build.json" "$SCRIPT_DIR/package.json"
    
    success "Package.json updated for macOS build"
}

# Build the macOS app
build_mac_app() {
    log "Building macOS application..."
    cd "$SCRIPT_DIR"
    
    # Build the app
    npm run build-mac
    
    if [ -d "$SCRIPT_DIR/dist/mac" ]; then
        success "macOS app built successfully"
        
        # Find the app bundle
        APP_BUNDLE_PATH=$(find "$SCRIPT_DIR/dist/mac" -name "*.app" -type d | head -1)
        
        if [ -n "$APP_BUNDLE_PATH" ]; then
            log "App bundle found at: $APP_BUNDLE_PATH"
            
            # Copy to desktop
            cp -R "$APP_BUNDLE_PATH" "$DESKTOP_PATH/"
            success "App copied to Desktop: $DESKTOP_PATH/$(basename "$APP_BUNDLE_PATH")"
            
            # Make executable
            chmod +x "$DESKTOP_PATH/$(basename "$APP_BUNDLE_PATH")/Contents/MacOS"/*
            
            # Create a launcher script on desktop
            create_desktop_launcher "$DESKTOP_PATH/$(basename "$APP_BUNDLE_PATH")"
            
        else
            error "App bundle not found in dist directory"
            exit 1
        fi
    else
        error "Build failed - dist directory not found"
        exit 1
    fi
}

# Create a desktop launcher script
create_desktop_launcher() {
    local app_path="$1"
    local script_path="$DESKTOP_PATH/Launch Claude Git Manager.command"
    
    cat > "$script_path" << EOF
#!/bin/bash
# Claude Git Manager Desktop Launcher

cd "\$(dirname "\$0")"
open "$app_path"
EOF
    
    chmod +x "$script_path"
    success "Desktop launcher created: $script_path"
}

# Create development launcher
create_dev_launcher() {
    local script_path="$DESKTOP_PATH/Claude Git Manager (Dev).command"
    
    cat > "$script_path" << EOF
#!/bin/bash
# Claude Git Manager Development Launcher

cd "$SCRIPT_DIR"
npm run dev
EOF
    
    chmod +x "$script_path"
    success "Development launcher created: $script_path"
}

# Restore original package.json
restore_package_json() {
    if [ -f "$SCRIPT_DIR/package.json.backup" ]; then
        mv "$SCRIPT_DIR/package.json.backup" "$SCRIPT_DIR/package.json"
        rm -f "$SCRIPT_DIR/package-build.json"
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    restore_package_json
    # rm -rf "$SCRIPT_DIR/assets/icon.iconset" 2>/dev/null || true
}

# Main function
main() {
    echo "🍎 Claude Git Manager - macOS App Builder"
    echo "========================================"
    echo
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    check_macos
    install_dependencies
    create_app_icon
    update_package_json
    build_mac_app
    create_dev_launcher
    
    echo
    success "🎉 macOS app creation completed!"
    echo
    echo "📱 App saved to: $DESKTOP_PATH/$APP_BUNDLE_NAME"
    echo "🚀 Launch script: $DESKTOP_PATH/Launch Claude Git Manager.command"
    echo "🛠️  Dev launcher: $DESKTOP_PATH/Claude Git Manager (Dev).command"
    echo
    echo "You can now:"
    echo "1. Double-click the app on your desktop to launch"
    echo "2. Drag it to Applications folder for permanent installation"
    echo "3. Use the dev launcher for development mode"
    echo
}

# Handle script arguments
case "${1:-build}" in
    "build")
        main
        ;;
    "icon-only")
        check_macos
        create_app_icon
        success "Icon created at: $SCRIPT_DIR/assets/icon.icns"
        ;;
    "clean")
        log "Cleaning build artifacts..."
        rm -rf "$SCRIPT_DIR/dist" "$SCRIPT_DIR/build" "$SCRIPT_DIR/assets/icon.iconset"
        rm -f "$SCRIPT_DIR/assets/icon.icns" "$SCRIPT_DIR/package-build.json"
        restore_package_json
        success "Cleanup completed"
        ;;
    "help"|"--help"|"-h")
        echo "Claude Git Manager - macOS App Builder"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  build       Build and install macOS app (default)"
        echo "  icon-only   Create app icon only"
        echo "  clean       Clean build artifacts"
        echo "  help        Show this help message"
        echo ""
        echo "Output:"
        echo "  App will be saved to: $DESKTOP_PATH/$APP_BUNDLE_NAME"
        echo "  Launcher script: $DESKTOP_PATH/Launch Claude Git Manager.command"
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac