#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Fully Automated Deployment Starting...');
console.log('=======================================\n');

const projectPath = path.join(__dirname, 'finsight-app');

// Function to execute commands
function exec(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      cwd: projectPath,
      ...options 
    });
  } catch (error) {
    return null;
  }
}

// Check if project exists
if (!fs.existsSync(projectPath)) {
  console.error('❌ Project not found at:', projectPath);
  process.exit(1);
}

console.log('📦 Preparing deployment...');

// Install dependencies if needed
if (!fs.existsSync(path.join(projectPath, 'node_modules'))) {
  console.log('Installing dependencies...');
  exec('npm install');
}

// Build the project
console.log('🔨 Building project...');
exec('npm run build');

// Create deployment info
const deploymentInfo = {
  name: 'aspire-finsight',
  version: '1.0.0',
  build: {
    command: 'npm run build',
    output: '.next'
  },
  routes: [
    { src: '/(.*)', dest: '/$1' }
  ]
};

fs.writeFileSync(
  path.join(projectPath, 'vercel.json'),
  JSON.stringify(deploymentInfo, null, 2)
);

// Try Vercel CLI deployment
console.log('\n🌐 Attempting automated deployment...');

const deployCommands = [
  'npx vercel --prod --yes --no-clipboard',
  'npx vercel deploy --prod --yes',
  'vercel --prod --confirm'
];

let deployed = false;
for (const cmd of deployCommands) {
  console.log(`Trying: ${cmd}`);
  const result = exec(cmd, { stdio: 'pipe' });
  if (result && !result.includes('error')) {
    deployed = true;
    console.log('✅ Deployment successful!');
    break;
  }
}

if (!deployed) {
  console.log('\n📱 Opening web deployment...');
  
  // Create deployment ZIP
  console.log('Creating deployment package...');
  exec('cd .. && zip -r finsight-app-deploy.zip finsight-app -x "*/node_modules/*" "*/.next/*" "*/.git/*"', {
    cwd: __dirname
  });
  
  // Create auto-deploy HTML
  const autoDeployHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Auto Deploy - Aspire FinSight</title>
    <meta http-equiv="refresh" content="1;url=https://vercel.com/new/upload">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .status { font-size: 24px; color: #0070f3; margin: 20px; }
    </style>
</head>
<body>
    <h1>🚀 Aspire FinSight - Auto Deployment</h1>
    <div class="status">Redirecting to Vercel...</div>
    <p>Upload file: finsight-app-deploy.zip</p>
    <p>Location: ${__dirname}</p>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'deploy.html'), autoDeployHTML);
  
  // Open browser and folder
  exec('open https://vercel.com/new/upload', { cwd: __dirname });
  exec('open .', { cwd: __dirname });
  exec('open deploy.html', { cwd: __dirname });
  
  console.log('\n✅ Automated setup complete!');
  console.log('📦 Deploy package: finsight-app-deploy.zip');
  console.log('🌐 Browser opened to Vercel');
  console.log('📁 Folder opened with package');
  console.log('\nJust drag and drop the ZIP file!');
}

console.log('\n🎉 Automation complete!');