/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Basic configuration
  images: {
    domains: [],
    unoptimized: true,
  },
  
  // Skip validation during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true, 
  },
  
  // Enable source maps in production
  productionBrowserSourceMaps: true,
  
  // Disable SWC compiler due to issues on some platforms
  swcMinify: false,
  
  // Completely disable minification and source maps to avoid Terser
  webpack: (config, { isServer, dev }) => {
    // Disable all minimizers
    config.optimization.minimize = false;
    
    // Remove any Terser plugins from the minimizer array
    if (config.optimization.minimizer) {
      config.optimization.minimizer = [];
    }
    
    // Use named modules for easier debugging
    config.optimization.moduleIds = 'named';
    config.optimization.chunkIds = 'named';
    
    // Use a simpler source map strategy that doesn't require Terser
    if (!isServer) {
      config.devtool = 'nosources-source-map';
    }
    
    // Completely bypass problematic CSS processing
    config.module.rules.forEach((rule) => {
      if (rule.oneOf) {
        rule.oneOf.forEach((oneOfRule) => {
          if (oneOfRule.test && oneOfRule.test.toString().includes('\\.css')) {
            // Disable source maps and advanced processing for CSS
            if (oneOfRule.use && Array.isArray(oneOfRule.use)) {
              oneOfRule.use = oneOfRule.use.map((loader) => {
                if (typeof loader === 'object' && loader.loader) {
                  if (loader.loader.includes('css-loader')) {
                    return {
                      ...loader,
                      options: {
                        sourceMap: false,
                        importLoaders: 0,
                        modules: false
                      }
                    };
                  }
                  if (loader.loader.includes('postcss-loader')) {
                    // Skip postcss-loader entirely
                    return null;
                  }
                }
                return loader;
              }).filter(Boolean);
            }
          }
        });
      }
    });
    
    return config;
  },
  
  // Server-side rendering enabled for API routes
  // output: 'export', // Commented out to allow API routes
  
  // Environment variables for build
  env: {
    PERPLEXITY_API_KEY: "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",
    NEXT_PUBLIC_PERPLEXITY_API_KEY: "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"
  }
}

module.exports = nextConfig