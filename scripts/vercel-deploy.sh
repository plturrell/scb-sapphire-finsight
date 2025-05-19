#!/bin/bash

# Vercel Deployment Script with Environment Variables
set -e

echo "🚀 Starting SCB Sapphire FinSight Vercel deployment..."

# Check if Redis URL is set
if [ -z "$REDIS_URL" ]; then
  echo "⚠️  No REDIS_URL environment variable found."
  echo "📝 For production, you'll need a Redis instance. You can use:"
  echo "   - Upstash Redis (recommended for Vercel): https://upstash.com"
  echo "   - Redis Cloud: https://redis.com/cloud"
  echo "   - Or any other Redis provider"
  echo ""
  echo "🔧 Using a placeholder Redis URL for now..."
  export REDIS_URL="redis://localhost:6379"
fi

# Navigate to project directory
cd "$(dirname "$0")/.." || exit

# Clean previous builds
if [ -d ".next" ]; then
  echo "🧹 Cleaning previous build..."
  rm -rf .next
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🏗️ Building project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Deployment completed!"
echo ""
echo "📌 Next steps:"
echo "1. Set up Redis in Vercel Dashboard -> Settings -> Environment Variables"
echo "2. Add REDIS_URL with your Redis connection string"
echo "3. Redeploy to apply the changes"
echo ""
echo "🔗 Visit your app at: https://finsight-app.vercel.app"