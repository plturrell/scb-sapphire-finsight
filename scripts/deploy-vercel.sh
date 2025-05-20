#!/bin/bash

# Alternative Vercel deployment script

echo "🚀 Starting direct deployment to Vercel..."

# Navigate to the project directory
cd "$(dirname "$0")/.." || exit

# Build the project
echo "🏗️ Building project..."
npm run build

# Deploy to Vercel with additional options
echo "🚀 Deploying to Vercel..."
npx vercel deploy --yes --prod

echo "✅ Deployment command completed!"
echo "📝 Note: If prompted for authentication, please follow the instructions in your browser."