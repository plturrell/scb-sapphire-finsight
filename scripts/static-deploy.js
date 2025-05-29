/**
 * Static deployment script for SCB Sapphire FinSight
 * 
 * This script creates a static deployment of the application
 * with all styling properly applied using pure CSS (no Tailwind build process)
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Creating static deployment with proper styling');

// Create out directory if it doesn't exist
const outDir = path.join(__dirname, '../out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

try {
  // Step 1: Run the Next.js export command (static HTML export)
  console.log('📦 Exporting Next.js static site');
  
  // Use next export (or handle if it's not available in this Next.js version)
  try {
    execSync('npx next export', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ Next export failed, using build method instead');
    
    // If next export fails, fall back to next build
    execSync('npm run build:safe', { stdio: 'inherit' });
    
    // Copy the built files to the out directory
    if (fs.existsSync(path.join(__dirname, '../.next/static'))) {
      console.log('📋 Copying built files to out directory');
      execSync('cp -r .next/static out/', { stdio: 'inherit' });
    }
  }
  
  // Step 2: Create index.html that redirects to dashboard or is a copy of dashboard.html
  const indexHtmlPath = path.join(outDir, 'index.html');
  const dashboardHtmlPath = path.join(outDir, 'dashboard.html');
  
  console.log('📝 Creating index.html that uses dashboard.html content');
  
  // Create dashboard.html first (this is done in next step)
  
  // Then create index.html as a redirect or copy of dashboard
  if (fs.existsSync(dashboardHtmlPath)) {
    // Copy dashboard.html to index.html for local development
    fs.copyFileSync(dashboardHtmlPath, indexHtmlPath);
    console.log('✅ Created index.html as a copy of dashboard.html');
  } else {
    // Create a minimal redirect
    const indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0;url=/dashboard.html" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SCB Sapphire FinSight</title>
  <link rel="icon" href="/favicon.ico" />
  <script>window.location.href = "/dashboard.html";</script>
</head>
<body>
  <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
    <div style="text-align: center;">
      <h1>SCB Sapphire FinSight</h1>
      <p>Redirecting to dashboard...</p>
      <p>If you are not redirected, <a href="/dashboard.html">click here</a>.</p>
    </div>
  </div>
</body>
</html>
    `;
    
    fs.writeFileSync(indexHtmlPath, indexHtml);
  }
  
  // Step 3: Create a dashboard.html file
  console.log('📝 Creating dashboard.html');
  const dashboardHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SCB Sapphire FinSight Dashboard</title>
  <link rel="icon" href="/favicon.ico" />
  <link rel="stylesheet" href="/styles/scb-styles.css" />
</head>
<body>
  <header class="fiori-shell-header" style="background-color: rgb(var(--scb-honolulu-blue)); color: white; height: 64px; display: flex; align-items: center; padding: 0 20px;">
    <div style="display: flex; justify-content: space-between; width: 100%; max-width: 1200px; margin: 0 auto;">
      <div style="font-weight: 700; font-size: 1.25rem;">SCB Sapphire FinSight</div>
      <div class="fiori-btn fiori-btn-primary" style="background-color: transparent; border: 1px solid rgba(255, 255, 255, 0.3);">
        View Reports
      </div>
    </div>
  </header>

  <main style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
    <section class="perfect-section">
      <h1 class="perfect-h1" style="color: rgb(var(--scb-honolulu-blue)); margin-bottom: 20px;">Financial Dashboard</h1>
      <p class="perfect-body" style="margin-bottom: 40px;">Welcome to your financial insights dashboard. View your performance metrics and analytics in real-time.</p>
      
      <h2 class="perfect-h2" style="margin-bottom: 20px;">Key Metrics</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(4, 1fr);">
        <div class="fiori-tile" style="padding: 20px;">
          <div style="font-size: 0.875rem; color: rgb(var(--scb-dark-gray)); margin-bottom: 8px;">Portfolio Value</div>
          <div class="perfect-h2" style="margin-bottom: 8px;">$347.2B</div>
          <div style="font-size: 0.875rem; color: rgb(var(--scb-american-green));">+$14.32M (+6.3%)</div>
        </div>
        
        <div class="fiori-tile" style="padding: 20px;">
          <div style="font-size: 0.875rem; color: rgb(var(--scb-dark-gray)); margin-bottom: 8px;">YTD Return</div>
          <div class="perfect-h2" style="margin-bottom: 8px;">+6.3%</div>
          <div style="font-size: 0.875rem; color: rgb(var(--scb-american-green));">↑ 1.2% Since last quarter</div>
        </div>
        
        <div class="fiori-tile" style="padding: 20px;">
          <div style="font-size: 0.875rem; color: rgb(var(--scb-dark-gray)); margin-bottom: 8px;">Risk Score</div>
          <div class="perfect-h2" style="margin-bottom: 8px;">7.2</div>
          <div style="font-size: 0.875rem; color: rgb(var(--scb-american-green));">Moderate Risk</div>
        </div>
        
        <div class="fiori-tile" style="padding: 20px;">
          <div style="font-size: 0.875rem; color: rgb(var(--scb-dark-gray)); margin-bottom: 8px;">Transaction Banking</div>
          <div class="perfect-h2" style="margin-bottom: 8px;">45%</div>
          <div style="font-size: 0.875rem;">Allocation</div>
        </div>
      </div>
    </section>
    
    <section class="perfect-section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 class="perfect-h2 scb-section-header">Intelligent Insights</h2>
        <div class="fiori-btn fiori-btn-primary">View All</div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(3, 1fr);">
        <div class="fiori-tile" style="padding: 20px;">
          <h3 class="fiori-tile-title">Market Performance Update</h3>
          <p class="perfect-body-small" style="margin-bottom: 20px;">5.2% growth across key sectors</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: rgb(var(--scb-dark-gray));">
            <div>Market Analysis</div>
            <div>Confidence: 88%</div>
          </div>
        </div>
        
        <div class="fiori-tile" style="padding: 20px;">
          <h3 class="fiori-tile-title">Investment Opportunity</h3>
          <p class="perfect-body-small" style="margin-bottom: 20px;">New opportunities in emerging markets show potential for high returns</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: rgb(var(--scb-dark-gray));">
            <div>AI Insights</div>
            <div>Confidence: 85%</div>
          </div>
        </div>
        
        <div class="fiori-tile" style="padding: 20px;">
          <h3 class="fiori-tile-title">System Status</h3>
          <p class="perfect-body-small" style="margin-bottom: 20px;">All systems operational, data refresh in progress</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: rgb(var(--scb-dark-gray));">
            <div>System Monitor</div>
            <div>Confidence: 95%</div>
          </div>
        </div>
      </div>
    </section>
    
    <section class="perfect-section">
      <h2 class="perfect-h2 scb-section-header" style="margin-bottom: 20px;">Quick Actions</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(4, 1fr);">
        <div class="fiori-tile" style="background-color: rgb(var(--scb-honolulu-blue)); color: white; padding: 20px;">
          <h3 style="font-weight: 600; margin-bottom: 10px; color: white;">Market Analysis</h3>
          <p style="font-size: 0.875rem; opacity: 0.8;">Deep dive into market trends</p>
        </div>
        
        <div class="fiori-tile" style="background-color: rgb(var(--scb-american-green)); color: white; padding: 20px;">
          <h3 style="font-weight: 600; margin-bottom: 10px; color: white;">Portfolio Review</h3>
          <p style="font-size: 0.875rem; opacity: 0.8;">Check current positions</p>
        </div>
        
        <div class="fiori-tile" style="background-color: rgb(var(--scb-muted-red)); color: white; padding: 20px;">
          <h3 style="font-weight: 600; margin-bottom: 10px; color: white;">Risk Assessment</h3>
          <p style="font-size: 0.875rem; opacity: 0.8;">Monitor risk exposure</p>
        </div>
        
        <div class="fiori-tile" style="background-color: rgb(var(--scb-dark-gray)); color: white; padding: 20px;">
          <h3 style="font-weight: 600; margin-bottom: 10px; color: white;">Development Todos</h3>
          <p style="font-size: 0.875rem; opacity: 0.8;">AI-generated tasks from git</p>
        </div>
      </div>
    </section>
  </main>
  
  <footer style="background-color: rgb(var(--scb-honolulu-blue)); color: white; padding: 40px 0; margin-top: 60px;">
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 40px;">
        <div style="min-width: 200px; margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 15px;">Products</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Portfolio Management</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Risk Analysis</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Trading Desk</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Reports</div>
        </div>
        
        <div style="min-width: 200px; margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 15px;">Resources</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Documentation</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">API Reference</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Tutorial Videos</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Knowledge Base</div>
        </div>
        
        <div style="min-width: 200px; margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 15px;">Company</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">About Us</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Contact</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Careers</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Blog</div>
        </div>
        
        <div style="min-width: 200px; margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 15px;">Legal</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Terms of Service</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Privacy Policy</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Cookies</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Compliance</div>
        </div>
      </div>
      
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.2); opacity: 0.6; font-size: 0.875rem;">
        © 2025 SCB Sapphire FinSight. All rights reserved.
      </div>
    </div>
  </footer>
</body>
</html>
  `;
  
  fs.writeFileSync(dashboardHtmlPath, dashboardHtml);
  
  // Step 4: Ensure the styles directory exists and copy the CSS files
  const stylesDir = path.join(outDir, 'styles');
  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir, { recursive: true });
  }
  
  // Copy the CSS file if it doesn't exist in the out directory
  const sourceStylesPath = path.join(__dirname, '../public/styles/scb-styles.css');
  const destStylesPath = path.join(stylesDir, 'scb-styles.css');
  
  if (!fs.existsSync(destStylesPath) && fs.existsSync(sourceStylesPath)) {
    fs.copyFileSync(sourceStylesPath, destStylesPath);
  }
  
  // Step 5: Copy public assets if needed
  const publicDir = path.join(__dirname, '../public');
  if (fs.existsSync(publicDir)) {
    console.log('📋 Copying public assets');
    
    // Create fonts directory if it doesn't exist
    const fontsDir = path.join(outDir, 'fonts');
    if (!fs.existsSync(fontsDir)) {
      fs.mkdirSync(fontsDir, { recursive: true });
    }
    
    // Copy font files
    const publicFontsDir = path.join(publicDir, 'fonts');
    if (fs.existsSync(publicFontsDir)) {
      const fontFiles = fs.readdirSync(publicFontsDir);
      fontFiles.forEach(file => {
        fs.copyFileSync(
          path.join(publicFontsDir, file),
          path.join(fontsDir, file)
        );
      });
    }
    
    // Copy favicon
    const faviconPath = path.join(publicDir, 'favicon.ico');
    if (fs.existsSync(faviconPath)) {
      fs.copyFileSync(
        faviconPath,
        path.join(outDir, 'favicon.ico')
      );
    }
  }
  
  console.log('✅ Static deployment created successfully');
  console.log('To view the application, run: npx serve out');
  
} catch (error) {
  console.error(`❌ Static deployment failed: ${error.message}`);
  process.exit(1);
}