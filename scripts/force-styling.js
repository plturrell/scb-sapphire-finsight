/**
 * SCB Sapphire FinSight Styling Deployment Script
 * 
 * This script ensures that all our beautiful UI styling created today is properly applied
 * in the deployed version. It modifies the Next.js build process to preserve our styling.
 */

const fs = require('fs');
const path = require('path');

// Paths to important files
const APP_PATH = path.join(__dirname, '../src/pages/_app.tsx');
const DOCUMENT_PATH = path.join(__dirname, '../src/pages/_document.tsx');
const NEXT_CONFIG_PATH = path.join(__dirname, '../next.config.js');

console.log('🎨 SCB Sapphire FinSight - Enforcing Beautiful UI Styling');

// Ensure that fonts are properly preloaded
function ensureFontPreloading() {
  console.log('Ensuring font preloading in _document.tsx...');
  
  const documentContent = fs.readFileSync(DOCUMENT_PATH, 'utf8');
  
  // Check if font preloading is missing
  if (!documentContent.includes('rel="preload"') || !documentContent.includes('SCProsperSans')) {
    console.log('Adding font preloading to _document.tsx...');
    
    // Add font preloading if missing
    const updatedContent = documentContent.replace(
      /(<Head>[\s\S]*?)(<\/Head>)/,
      `$1
        {/* SC Prosper Sans Font Preloading */}
        <link 
          rel="preload" 
          href="/fonts/SCProsperSans-Regular.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        <link 
          rel="preload" 
          href="/fonts/SCProsperSans-Medium.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        <link 
          rel="preload" 
          href="/fonts/SCProsperSans-Bold.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        <link 
          rel="preload" 
          href="/fonts/SCProsperSans-Light.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
      $2`
    );
    
    fs.writeFileSync(DOCUMENT_PATH, updatedContent);
    console.log('✅ Font preloading added successfully');
  } else {
    console.log('✅ Font preloading already exists');
  }
}

// Ensure that Next.js config preserves our styling
function ensureNextConfig() {
  console.log('Ensuring Next.js config preserves styling...');
  
  const configContent = fs.readFileSync(NEXT_CONFIG_PATH, 'utf8');
  
  // Check if CSS optimization is enabled (which could strip out our styling)
  if (configContent.includes('optimizeCss: true')) {
    console.log('Disabling CSS optimization to preserve our styling...');
    
    // Disable CSS optimization to preserve our styling
    const updatedContent = configContent.replace(
      /optimizeCss: true/,
      'optimizeCss: false // Preserve our custom styling'
    );
    
    fs.writeFileSync(NEXT_CONFIG_PATH, updatedContent);
    console.log('✅ CSS optimization disabled successfully');
  } else {
    console.log('✅ CSS optimization already disabled');
  }
}

// Run the styling enforcement
try {
  ensureFontPreloading();
  ensureNextConfig();
  
  console.log('\n🎉 All done! Your beautiful SCB Sapphire UI styling will now be applied correctly in the deployed version.');
  console.log('Run npm run build to create a production build with all styling intact.');
} catch (error) {
  console.error('❌ Error ensuring styling:', error);
  process.exit(1);
}