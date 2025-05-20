#!/bin/bash

# Simple script to force a Vercel deployment

echo "🚀 Triggering Vercel deployment manually..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

# Navigate to project directory
cd "$(dirname "$0")"

# Deploy to Vercel (with minimal output, non-interactive)
echo "Deploying to Vercel..."
vercel --prod --confirm

echo "✅ Deployment request sent. Check the Vercel dashboard for status."
echo "   https://vercel.com/dashboard"