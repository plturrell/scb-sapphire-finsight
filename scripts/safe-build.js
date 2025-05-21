/**
 * Safe build script with source map generation
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️ Running safe build script with source map support...');

// Path to the Next.js configuration file
const NEXT_CONFIG_PATH = path.join(__dirname, '../next.config.js');
const configContent = fs.readFileSync(NEXT_CONFIG_PATH, 'utf8');

// Check if source maps are already enabled
if (!configContent.includes('productionBrowserSourceMaps: true')) {
  console.log('Ensuring source maps are enabled in next.config.js...');
  
  // Add source map support to config if not present
  const updatedConfig = configContent.replace(
    'const nextConfig = {',
    'const nextConfig = {\n  productionBrowserSourceMaps: true,'
  );
  
  fs.writeFileSync(NEXT_CONFIG_PATH, updatedConfig);
  console.log('✅ Updated next.config.js with source map support');
}

try {
  // Use the local next binary from node_modules
  console.log('Starting Next.js build with source maps enabled...');
  execSync('node ./node_modules/next/dist/bin/next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1'
    }
  });
  
  console.log('✅ Build completed successfully with source maps');
} catch (error) {
  console.error(`❌ Build failed: ${error.message}`);
  process.exit(1);
}