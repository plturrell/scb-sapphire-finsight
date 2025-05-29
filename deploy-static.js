/**
 * Static deployment script for SCB Sapphire FinSight
 * 
 * This script creates a static deployment of the application
 * with all styling properly applied.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Creating static deployment with proper styling');

// Create out directory if it doesn't exist
const outDir = path.join(__dirname, 'out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// Create a minimal index.html
const indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SCB Sapphire FinSight</title>
  <link rel="icon" href="/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <style>
    @font-face {
      font-family: 'SCProsperSans';
      font-style: normal;
      font-weight: 300;
      font-display: swap;
      src: url('/fonts/SCProsperSans-Light.woff2') format('woff2');
    }
    
    @font-face {
      font-family: 'SCProsperSans';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('/fonts/SCProsperSans-Regular.woff2') format('woff2');
    }
    
    @font-face {
      font-family: 'SCProsperSans';
      font-style: normal;
      font-weight: 500;
      font-display: swap;
      src: url('/fonts/SCProsperSans-Medium.woff2') format('woff2');
    }
    
    @font-face {
      font-family: 'SCProsperSans';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: url('/fonts/SCProsperSans-Bold.woff2') format('woff2');
    }
    
    :root {
      --scb-honolulu-blue: 0, 114, 170;
      --scb-american-green: 33, 170, 71;
      --scb-white: 255, 255, 255;
      --scb-light-gray: 245, 247, 250;
      --scb-dark-gray: 82, 83, 85;
      --scb-muted-red: 211, 55, 50;
      --scb-border: 229, 231, 235;
    }
    
    html {
      font-family: 'SCProsperSans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 
                  'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif;
    }
    
    body {
      margin: 0;
      padding: 0;
      background-color: rgb(var(--scb-light-gray));
      color: rgb(0, 0, 0);
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(var(--scb-honolulu-blue), 0.1);
      border-radius: 50%;
      border-top-color: rgb(var(--scb-honolulu-blue));
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      padding: 40px 0;
    }
    
    .title {
      font-size: 2.5rem;
      font-weight: 700;
      color: rgb(var(--scb-honolulu-blue));
      margin-bottom: 10px;
    }
    
    .subtitle {
      font-size: 1.2rem;
      color: rgb(var(--scb-dark-gray));
    }
    
    .cta {
      margin-top: 30px;
      display: inline-block;
      background-color: rgb(var(--scb-honolulu-blue));
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }
    
    .cta:hover {
      background-color: rgba(var(--scb-honolulu-blue), 0.9);
    }
  </style>
</head>
<body>
  <div id="__next">
    <div class="loading">
      <div class="spinner"></div>
    </div>
    <noscript>
      <div class="content">
        <div class="header">
          <div class="title">SCB Sapphire FinSight</div>
          <div class="subtitle">Financial Insights Dashboard</div>
          <a href="/dashboard" class="cta">View Dashboard</a>
        </div>
      </div>
    </noscript>
  </div>
  <script>
    window.location.href = '/dashboard';
  </script>
</body>
</html>
`;

// Write the index.html file
fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);

// Copy public directory
console.log('Copying public assets...');
execSync('cp -r public/* out/', { stdio: 'inherit' });

// Create a success message
console.log('✅ Static deployment created successfully');
console.log('To view the application, run: npx serve out');