#!/bin/bash

# Deploy the refined UI to Vercel
echo "🚀 Deploying refined UI to Vercel..."

# Run the refined UI deployment script
node scripts/enhanced-ui/deploy-refined-ui.js

# Check if deployment was successful
if [ $? -ne 0 ]; then
  echo "❌ Failed to prepare refined UI for deployment"
  exit 1
fi

# Ask for confirmation before deploying to production
read -p "🔄 Deploy to production? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "⏹️ Deployment cancelled"
  exit 0
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel production..."
vercel --prod

echo "✨ Deployment complete!"