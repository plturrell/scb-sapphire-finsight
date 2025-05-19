#!/bin/bash

# Production deployment script for FinSight application
set -e

echo "🚀 Starting production deployment..."

# Check if Redis is available
echo "🔍 Checking Redis connection..."
redis-cli ping > /dev/null 2>&1 || { echo "❌ Redis is not running. Please start Redis first."; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🏗️ Building the application..."
npm run build

# Run tests (if any)
# echo "🧪 Running tests..."
# npm test

# Start the production server
echo "🎯 Starting production server..."
npm start

echo "✅ Deployment complete! Application is running."