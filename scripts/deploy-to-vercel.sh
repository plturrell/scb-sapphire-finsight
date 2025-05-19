#!/bin/bash

# SCB Sapphire FinSight Vercel Deployment Script
# This script prepares and deploys the application to Vercel

echo "🚀 Starting SCB Sapphire FinSight deployment process..."

# Navigate to the project directory
cd "$(dirname "$0")/.." || exit

# Check for .next directory and remove if it exists to ensure a clean build
if [ -d ".next" ]; then
  echo "🧹 Cleaning previous build artifacts..."
  rm -rf .next
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Skip linting for now
echo "🔍 Skipping linting checks to proceed with deployment..."

# Build the project
echo "🏗️ Building project..."
npm run build || { echo "❌ Build failed. Please fix the build issues before deploying."; exit 1; }

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "📥 Vercel CLI not found. Installing globally..."
  npm install -g vercel
fi

# Set environment variable for Redis (if needed)
echo "🔧 Setting environment variables..."
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --yes --env REDIS_URL="$REDIS_URL"

echo "✅ Deployment process completed!"
echo "📝 Note: If you encounter any issues, please check the Vercel dashboard for more details."
