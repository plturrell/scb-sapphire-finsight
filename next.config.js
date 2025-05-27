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
  
  // Experimental features
  experimental: {
    craCompat: false,
    esmExternals: false,
    webpackBuildWorker: false
  },
  
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
    
    // Simplify CSS processing
    config.module.rules.forEach((rule) => {
      if (rule.oneOf) {
        rule.oneOf.forEach((oneOfRule) => {
          if (oneOfRule.test && oneOfRule.test.toString().includes('\\.css')) {
            if (oneOfRule.use && Array.isArray(oneOfRule.use)) {
              oneOfRule.use.forEach((loader) => {
                if (typeof loader === 'object' && loader.options) {
                  // Only disable source maps for css-loader and postcss-loader
                  if (loader.loader && (loader.loader.includes('css-loader') || loader.loader.includes('postcss-loader'))) {
                    loader.options.sourceMap = false;
                  }
                  // Remove invalid sourceMap option from mini-css-extract-plugin
                  if (loader.loader && loader.loader.includes('mini-css-extract-plugin')) {
                    delete loader.options.sourceMap;
                  }
                }
              });
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