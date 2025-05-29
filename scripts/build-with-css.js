/**
 * Custom build script that ensures proper CSS processing
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Building SCB Sapphire FinSight with proper CSS integration');

// Create public/styles directory if it doesn't exist
const stylesDir = path.join(__dirname, '../public/styles');
if (!fs.existsSync(stylesDir)) {
  console.log('📁 Creating styles directory');
  fs.mkdirSync(stylesDir, { recursive: true });
}

try {
  // Step 1: Build the CSS with Tailwind
  console.log('🎨 Building CSS with Tailwind');
  execSync('npm run css:build', { stdio: 'inherit' });
  
  // Step 2: Run the Next.js build
  console.log('🏗️ Running Next.js build');
  execSync('npm run build:safe', { stdio: 'inherit' });
  
  // Step 3: Copy the CSS to the .next directory
  console.log('📋 Copying CSS to .next directory');
  const nextDir = path.join(__dirname, '../.next/static/css');
  if (!fs.existsSync(nextDir)) {
    fs.mkdirSync(nextDir, { recursive: true });
  }
  fs.copyFileSync(
    path.join(stylesDir, 'main.css'), 
    path.join(nextDir, 'main.css')
  );
  
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error(`❌ Build failed: ${error.message}`);
  process.exit(1);
}