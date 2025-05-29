#!/bin/bash

# Serve the static deployment with a simple HTTP server

# Check if npx is available
if ! command -v npx &> /dev/null; then
  echo "❌ npx is required but not found. Please install Node.js."
  exit 1
fi

# Create the out directory if it doesn't exist
if [ ! -d "out" ]; then
  echo "📂 Creating out directory..."
  mkdir -p out
fi

# Run the deploy-static.js script if dashboard.html doesn't exist
if [ ! -f "out/dashboard.html" ]; then
  echo "🚀 Running deployment script..."
  node deploy-static.js
fi

# Serve the static site
echo "🌐 Starting server..."
echo "📊 View the dashboard at http://localhost:3000/dashboard"
npx serve out