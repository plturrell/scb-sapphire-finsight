/**
 * Static Export Script
 * 
 * Creates a minimal static site that can be deployed to Vercel without any build steps.
 */
const fs = require('fs');
const path = require('path');

console.log('🚀 Creating static export for Vercel deployment...');

// Create output directories
const outDir = path.join(__dirname, '../out');
const dashboardDir = path.join(outDir, 'dashboard');
const imagesDir = path.join(outDir, 'images');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

if (!fs.existsSync(dashboardDir)) {
  fs.mkdirSync(dashboardDir, { recursive: true });
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Create a simple index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SCB Sapphire FinSight</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f7fa;
      color: #333;
      flex-direction: column;
    }
    .container {
      text-align: center;
      max-width: 800px;
      padding: 2rem;
    }
    .logo {
      background-color: #0072AA;
      color: white;
      font-size: 2rem;
      padding: 1rem 2rem;
      border-radius: 4px;
      margin-bottom: 2rem;
    }
    .spinner {
      border: 4px solid rgba(0, 114, 170, 0.1);
      border-radius: 50%;
      border-top: 4px solid #0072AA;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 2rem 0;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .btn {
      background-color: #0072AA;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      text-decoration: none;
      margin-top: 1rem;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">SCB Sapphire FinSight</div>
    <h1>Welcome to SCB Sapphire FinSight</h1>
    <p>Your financial insights platform is currently in maintenance mode.</p>
    <div class="spinner"></div>
    <p>Our team is working on enhancing the application.</p>
    <a href="/dashboard" class="btn">Go to Dashboard</a>
  </div>
</body>
</html>`;

// Create a simple dashboard page
const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SCB Sapphire FinSight Dashboard</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f7fa;
      color: #333;
    }
    .header {
      background-color: #0072AA;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .btn {
      background-color: #0072AA;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SCB Sapphire FinSight</h1>
    <a href="/" class="btn">Home</a>
  </div>
  
  <div class="container">
    <div class="card">
      <h2>Dashboard</h2>
      <p>Welcome to the SCB Sapphire FinSight Dashboard. The full interactive dashboard is currently in maintenance mode.</p>
    </div>
    
    <div class="grid">
      <div class="card">
        <h3>Financial Analysis</h3>
        <p>View financial performance metrics and trends.</p>
      </div>
      <div class="card">
        <h3>Risk Assessment</h3>
        <p>Analyze potential risks and mitigation strategies.</p>
      </div>
      <div class="card">
        <h3>Market Intelligence</h3>
        <p>Monitor market trends and competitive landscape.</p>
      </div>
      <div class="card">
        <h3>Compliance</h3>
        <p>Track regulatory compliance and reporting status.</p>
      </div>
    </div>
    
    <div class="card">
      <h3>System Status: Maintenance</h3>
      <p>Our team is working on enhancing the application with improved features and performance.</p>
      <p>Please check back soon for the full interactive experience.</p>
    </div>
  </div>
</body>
</html>`;

// Create the minimal pages
fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);
fs.writeFileSync(path.join(dashboardDir, 'index.html'), dashboardHtml);

// Create Vercel routing configuration
const vercelJson = {
  "version": 2,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/dashboard", "dest": "/dashboard/index.html" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
};

fs.writeFileSync(path.join(outDir, 'vercel.json'), JSON.stringify(vercelJson, null, 2));

// Create a dummy .next directory to satisfy Vercel
const nextDir = path.join(__dirname, '../.next');
if (!fs.existsSync(nextDir)) {
  fs.mkdirSync(nextDir, { recursive: true });
  fs.writeFileSync(path.join(nextDir, 'BUILD_ID'), Date.now().toString());
}

console.log('✅ Static export successfully created in the "out" directory');
console.log('Now ready for Vercel deployment');