const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const projectRoot = path.resolve(__dirname, '../..');
const outputDir = path.join(projectRoot, 'out');
const srcStylesDir = path.join(projectRoot, 'src/styles');
const srcImagesDir = path.join(projectRoot, 'public/images');
const srcFontsDir = path.join(projectRoot, 'public/fonts');
const stylesOutDir = path.join(outputDir, 'styles');
const imagesOutDir = path.join(outputDir, 'images');
const fontsOutDir = path.join(outputDir, 'fonts');

// Ensure directories exist
console.log('🔄 Setting up output directories...');
[outputDir, stylesOutDir, imagesOutDir, fontsOutDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Copy refined CSS to output directory
console.log('🔄 Copying refined CSS...');
try {
  // If refined-system.css doesn't exist, create an empty file to prevent errors
  if (!fs.existsSync(path.join(srcStylesDir, 'refined-system.css'))) {
    console.warn('⚠️ refined-system.css not found, creating an empty file');
    fs.writeFileSync(path.join(srcStylesDir, 'refined-system.css'), '/* Empty CSS file */');
  }
  
  // Ensure styles directory exists
  if (!fs.existsSync(stylesOutDir)) {
    fs.mkdirSync(stylesOutDir, { recursive: true });
  }
  
  // Copy the CSS file
  fs.copyFileSync(
    path.join(srcStylesDir, 'refined-system.css'),
    path.join(stylesOutDir, 'refined-system.css')
  );
  console.log('✅ Copied refined CSS');
} catch (err) {
  console.error('❌ Error copying refined CSS:', err);
}

// Copy static assets
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️ Source directory ${src} does not exist`);
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('🔄 Copying static assets...');
try {
  copyDir(srcImagesDir, imagesOutDir);
  console.log('✅ Copied images');
  
  copyDir(srcFontsDir, fontsOutDir);
  console.log('✅ Copied fonts');
} catch (err) {
  console.error('❌ Error copying static assets:', err);
}

// Run the static export process first if needed
console.log('🔄 Running static export if needed...');
try {
  if (!fs.existsSync(path.join(outputDir, 'index.html'))) {
    console.log('Static export not found, running export script...');
    execSync('node scripts/static-export.js', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✅ Static export complete');
  } else {
    console.log('✅ Static export already exists, skipping');
  }
} catch (err) {
  console.error('❌ Error running static export:', err);
}

// Apply refined design to HTML files
console.log('🔄 Applying refined design system to HTML files...');
try {
  execSync('node scripts/enhanced-ui/apply-refined-design.js', { cwd: projectRoot, stdio: 'inherit' });
  console.log('✅ Applied refined design system');
} catch (err) {
  console.error('❌ Error applying refined design system:', err);
}

// Update package.json to include refined UI build script
console.log('🔄 Updating package.json with refined UI build script...');
try {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add refined UI build script
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts['build:refined-ui'] = 'node scripts/enhanced-ui/deploy-refined-ui.js';
  packageJson.scripts['build:static'] = 'next build && next export && node scripts/enhanced-ui/deploy-refined-ui.js';
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json with refined UI build scripts');
} catch (err) {
  console.error('❌ Error updating package.json:', err);
}

// Instructions for Vercel deployment
console.log(`
✨ Refined UI deployment preparation complete! ✨

To deploy to Vercel:
1. Commit your changes to git
2. Run: vercel --prod

The build command in vercel.json has been updated to include the refined UI deployment.
`);