/**
 * Post-build script for dynamic functionality
 * This script ensures that CSS is properly loaded and critical files are in place
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Running post-build dynamic script...');

// Ensure the .next directory exists
const nextDir = path.join(__dirname, '../.next');
if (!fs.existsSync(nextDir)) {
  console.error('❌ .next directory not found. Build may have failed.');
  process.exit(1);
}

// Copy CSS files to ensure they're available
const publicStylesDir = path.join(__dirname, '../public/styles');
const nextStylesDir = path.join(nextDir, 'static/styles');

if (!fs.existsSync(nextStylesDir)) {
  fs.mkdirSync(nextStylesDir, { recursive: true });
}

// Copy scb-styles.css to static directory
try {
  if (fs.existsSync(path.join(publicStylesDir, 'scb-styles.css'))) {
    fs.copyFileSync(
      path.join(publicStylesDir, 'scb-styles.css'),
      path.join(nextStylesDir, 'scb-styles.css')
    );
    console.log('✅ Copied scb-styles.css to .next/static/styles');
  }
} catch (error) {
  console.warn(`⚠️ Error copying CSS: ${error.message}`);
}

// Create a dynamic loading patch to inject CSS
const patchFile = path.join(nextDir, 'static/chunks/pages/_app.js');
if (fs.existsSync(patchFile)) {
  try {
    let content = fs.readFileSync(patchFile, 'utf8');
    
    // Only patch if not already patched
    if (!content.includes('DYNAMIC_CSS_PATCH_APPLIED')) {
      // Add CSS injection code
      const cssInjection = `
// DYNAMIC_CSS_PATCH_APPLIED
(function() {
  // Dynamically load essential CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/styles/scb-styles.css';
  document.head.appendChild(link);

  // Ensure styles are applied
  document.documentElement.style.setProperty('--scb-honolulu-blue', '0, 114, 170');
  document.documentElement.style.setProperty('--scb-american-green', '33, 170, 71');
})();
`;
      
      // Insert at the beginning of the file
      content = cssInjection + content;
      fs.writeFileSync(patchFile, content);
      console.log('✅ Patched _app.js with CSS injection');
    } else {
      console.log('ℹ️ App already patched with CSS injection');
    }
  } catch (error) {
    console.warn(`⚠️ Error patching app: ${error.message}`);
  }
}

// Copy fonts to ensure they're available
const publicFontsDir = path.join(__dirname, '../public/fonts');
const nextFontsDir = path.join(nextDir, 'static/fonts');

if (!fs.existsSync(nextFontsDir)) {
  fs.mkdirSync(nextFontsDir, { recursive: true });
}

try {
  if (fs.existsSync(publicFontsDir)) {
    const fontFiles = fs.readdirSync(publicFontsDir);
    fontFiles.forEach(file => {
      if (file.endsWith('.woff2')) {
        fs.copyFileSync(
          path.join(publicFontsDir, file),
          path.join(nextFontsDir, file)
        );
      }
    });
    console.log('✅ Copied font files to .next/static/fonts');
  }
} catch (error) {
  console.warn(`⚠️ Error copying fonts: ${error.message}`);
}

// Create Vercel build output directory if it doesn't exist
const vercelOutputDir = path.join(__dirname, '../.vercel/output');
if (!fs.existsSync(vercelOutputDir)) {
  fs.mkdirSync(vercelOutputDir, { recursive: true });
  fs.mkdirSync(path.join(vercelOutputDir, 'static'), { recursive: true });
}

// Create a config.json file in the Vercel output directory
const vercelConfig = {
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/styles/(.*)', dest: '/styles/$1' },
    { src: '/fonts/(.*)', dest: '/fonts/$1' },
    { src: '/images/(.*)', dest: '/images/$1' },
    { src: '/assets/(.*)', dest: '/assets/$1' },
    { src: '/(.*)', dest: '/index.html' }
  ]
};

try {
  fs.writeFileSync(
    path.join(vercelOutputDir, 'config.json'),
    JSON.stringify(vercelConfig, null, 2)
  );
  console.log('✅ Created Vercel output config.json');
} catch (error) {
  console.warn(`⚠️ Error creating Vercel config: ${error.message}`);
}

console.log('✅ Post-build dynamic script completed successfully');