# Deployment Guide for Aspire FinSight

## Option 1: Deploy to Vercel (Recommended)

1. **Create a Vercel account**:
   - Go to https://vercel.com/signup
   - Sign up with GitHub, GitLab, Bitbucket, or email

2. **Install Vercel CLI** (already done):
   ```bash
   npm i -g vercel
   ```

3. **Deploy using CLI**:
   ```bash
   cd finsight-app
   vercel login
   vercel
   ```

4. **Alternative: Deploy via Web Interface**:
   - Go to https://vercel.com/new
   - Import your project
   - Connect your GitHub repository or upload the project folder
   - Click "Deploy"

## Option 2: Deploy to Netlify

1. **Create a Netlify account**:
   - Go to https://www.netlify.com/signup

2. **Deploy via drag & drop**:
   - Build the project: `npm run build`
   - Go to https://app.netlify.com/drop
   - Drag the `.next` folder to the drop zone

3. **Deploy via CLI**:
   ```bash
   npm i -g netlify-cli
   netlify deploy --dir=.next --prod
   ```

## Option 3: Deploy to GitHub Pages

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**:
   ```json
   "scripts": {
     "export": "next export",
     "deploy-gh": "npm run build && npm run export && gh-pages -d out"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy-gh
   ```

## Option 4: Deploy to Railway

1. **Create Railway account**:
   - Go to https://railway.app/

2. **Deploy via GitHub**:
   - Connect your GitHub repository
   - Railway will auto-deploy

## Option 5: Deploy to Render

1. **Create Render account**:
   - Go to https://render.com/

2. **Create new Web Service**:
   - Connect GitHub repository
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`

## Environment Variables

If you need to add environment variables:

1. Create `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=your_api_url
   ```

2. Add to your deployment platform's environment variables

## Build Output

The production build is already created in:
- `.next/` directory
- Ready for deployment

## Quick Deploy Command

For immediate deployment to Vercel (after login):
```bash
vercel --prod
```

## Support

If you encounter issues:
1. Check the build logs
2. Ensure all dependencies are installed
3. Verify Node.js version compatibility (16.x or higher)