#!/bin/bash

# Aspire FinSight Deployment Script

echo "🚀 Aspire FinSight Deployment Options"
echo "===================================="
echo ""
echo "Choose your deployment platform:"
echo "1) Vercel (Recommended)"
echo "2) Netlify"
echo "3) Railway"
echo "4) Render"
echo "5) Manual deployment package"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "Deploying to Vercel..."
        echo "Please run: vercel login"
        echo "Then run: vercel --prod"
        ;;
    2)
        echo "Deploying to Netlify..."
        echo "1. Go to https://app.netlify.com/drop"
        echo "2. Drag the .next folder"
        echo "Or install netlify-cli: npm i -g netlify-cli"
        echo "Then run: netlify deploy --dir=.next --prod"
        ;;
    3)
        echo "Deploying to Railway..."
        echo "1. Go to https://railway.app/"
        echo "2. Connect your GitHub repository"
        ;;
    4)
        echo "Deploying to Render..."
        echo "1. Go to https://render.com/"
        echo "2. Create a new Web Service"
        echo "3. Set build command: npm install && npm run build"
        echo "4. Set start command: npm start"
        ;;
    5)
        echo "Creating deployment package..."
        tar -czf finsight-app-deploy.tar.gz .next package.json package-lock.json
        echo "✅ Deployment package created: finsight-app-deploy.tar.gz"
        echo "Upload this file to your hosting provider"
        ;;
    *)
        echo "Invalid choice"
        ;;
esac