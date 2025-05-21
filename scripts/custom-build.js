/**
 * Custom build script to bypass Terser minification issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️ Running custom build script that avoids Terser minification...');

// Update Next.js config temporarily for this build
const NEXT_CONFIG_PATH = path.join(__dirname, '../next.config.js');
let configContent = fs.readFileSync(NEXT_CONFIG_PATH, 'utf8');

// Create backup of original config
fs.writeFileSync(`${NEXT_CONFIG_PATH}.backup`, configContent);

// Function to restore original config
function restoreConfig() {
  if (fs.existsSync(`${NEXT_CONFIG_PATH}.backup`)) {
    fs.copyFileSync(`${NEXT_CONFIG_PATH}.backup`, NEXT_CONFIG_PATH);
    fs.unlinkSync(`${NEXT_CONFIG_PATH}.backup`);
  }
}

try {
  // Modify webpack config to completely disable minimizers
  if (!configContent.includes('minimizer = []')) {
    console.log('Injecting custom webpack configuration to disable Terser...');
    
    const webpackConfigPattern = /webpack: \(config, \{ isServer, dev \}\) => \{/;
    if (webpackConfigPattern.test(configContent)) {
      configContent = configContent.replace(
        webpackConfigPattern,
        'webpack: (config, { isServer, dev }) => {\n    // Completely disable minification to avoid Terser errors\n    if (!isServer) {\n      config.optimization.minimize = false;\n      config.optimization.minimizer = [];\n    }'
      );
      
      fs.writeFileSync(NEXT_CONFIG_PATH, configContent);
      console.log('✅ Added custom webpack configuration');
    } else {
      console.warn('⚠️ Could not find webpack config pattern, skipping injection');
    }
  }

  // Set environment variables to avoid minimization
  const env = {
    ...process.env,
    NODE_ENV: 'development', // Force development mode
    NEXT_SKIP_MINIFY: '1',   // Skip minification explicitly
    NEXT_DISABLE_TERSER: '1', // Custom flag to disable Terser
    NEXT_MINIMIZE: 'false',   // Another way to disable minimization
  };

  // Run next build with the modified configuration and environment
  console.log('Building Next.js application without minification...');
  execSync('npx next build', { 
    stdio: 'inherit',
    env,
  });
  
  console.log('\n✅ Build completed successfully without Terser minification');
} catch (error) {
  console.error(`\n❌ Build failed: ${error.message}`);
  process.exit(1);
} finally {
  // Always restore the original configuration
  restoreConfig();
}
