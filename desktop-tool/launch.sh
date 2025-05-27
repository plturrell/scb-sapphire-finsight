#!/bin/bash

# Claude Git Desktop Manager Launcher
# Simple launcher script for the desktop application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[CLAUDE-DESKTOP]${NC} $1"
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

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        error "Node.js is not installed. Please install Node.js 16+ to continue."
        exit 1
    fi
    
    local node_version=$(node --version | sed 's/v//')
    local major_version=$(echo $node_version | cut -d. -f1)
    
    if [ "$major_version" -lt 16 ]; then
        error "Node.js version $node_version is too old. Please install Node.js 16+ to continue."
        exit 1
    fi
    
    success "Node.js $node_version detected"
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        error "npm is not installed. Please install npm to continue."
        exit 1
    fi
    
    success "npm $(npm --version) detected"
    
    # Check if we're in a Git repository
    if git rev-parse --git-dir >/dev/null 2>&1; then
        success "Git repository detected"
    else
        warn "Not in a Git repository - some features may be limited"
    fi
}

# Install dependencies if needed
install_dependencies() {
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        log "Installing dependencies..."
        cd "$SCRIPT_DIR"
        npm install
        success "Dependencies installed"
    else
        log "Dependencies already installed"
    fi
}

# Launch the application
launch_app() {
    log "Launching Claude Git Desktop Manager..."
    cd "$SCRIPT_DIR"
    
    if [ "$1" = "--dev" ]; then
        log "Starting in development mode..."
        npm run dev
    else
        npm start
    fi
}

# Main function
main() {
    echo "🌳 Claude Git Desktop Manager"
    echo "============================="
    echo
    
    check_dependencies
    install_dependencies
    launch_app "$@"
}

# Handle script arguments
case "${1:-start}" in
    "start")
        main
        ;;
    "dev")
        main --dev
        ;;
    "install")
        check_dependencies
        install_dependencies
        success "Installation completed"
        ;;
    "build")
        check_dependencies
        install_dependencies
        log "Building application..."
        cd "$SCRIPT_DIR"
        npm run build
        success "Build completed"
        ;;
    "help"|"--help"|"-h")
        echo "Claude Git Desktop Manager Launcher"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  start     Launch the application (default)"
        echo "  dev       Launch in development mode"
        echo "  install   Install dependencies only"
        echo "  build     Build the application"
        echo "  help      Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                # Launch application"
        echo "  $0 dev            # Launch in development mode"
        echo "  $0 build          # Build for distribution"
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac