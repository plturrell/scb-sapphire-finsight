// Override for Next.js webpack configuration to completely disable Terser
// This file will be used with NODE_OPTIONS to intercept the Next.js build process

const Module = require('module');
const originalRequire = Module.prototype.require;

// Intercept webpack configuration creation
Module.prototype.require = function(path) {
  const result = originalRequire.apply(this, arguments);
  
  // If this is the webpack configuration for Next.js
  if (path === 'next/dist/build/webpack-config' || 
      path === 'next/dist/build/webpack/config' ||
      path.includes('webpack-config')) {
    
    // Override the createWebpackConfig function to disable minification
    const originalCreateConfig = result.default;
    if (typeof originalCreateConfig === 'function') {
      result.default = function() {
        const config = originalCreateConfig.apply(this, arguments);
        
        // Force development mode to disable optimizations
        config.mode = 'development';
        
        // Completely disable minification
        if (config.optimization) {
          config.optimization.minimize = false;
          config.optimization.minimizer = [];
          
          // Disable other optimizations that could trigger Terser
          config.optimization.splitChunks = { cacheGroups: {} };
          config.optimization.runtimeChunk = false;
          config.optimization.flagIncludedChunks = false;
          config.optimization.providedExports = false;
          config.optimization.usedExports = false;
          config.optimization.concatenateModules = false;
        }
        
        console.log('🛠 [PATCH] Disabled all webpack optimizations');
        return config;
      };
    }
  }
  
  return result;
};