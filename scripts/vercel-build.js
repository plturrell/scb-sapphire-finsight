/**
 * Custom build script for Vercel that ensures proper source maps are generated
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🏗️ Running custom Vercel build script with source map support');

// Ensure next.config.js has source maps enabled
const nextConfigPath = path.join(__dirname, '../next.config.js');
const originalConfig = fs.readFileSync(nextConfigPath, 'utf8');

// Check if the config already has productionBrowserSourceMaps
if (!originalConfig.includes('productionBrowserSourceMaps')) {
  console.log('Adding source map support to next.config.js');
  
  // Simple string replacement to add source map support
  const updatedConfig = originalConfig.replace(
    'const nextConfig = {',
    'const nextConfig = {\n  productionBrowserSourceMaps: true,'
  );
  
  fs.writeFileSync(nextConfigPath, updatedConfig);
  console.log('✅ Updated next.config.js with source map support');
}

try {
  // Use the local next binary from node_modules
  console.log('Starting Next.js build...');
  execSync('node ./node_modules/next/dist/bin/next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  });
  
  console.log('✅ Build completed successfully with source maps');
} catch (error) {
  console.error(`❌ Build failed: ${error.message}`);
  process.exit(1);
}