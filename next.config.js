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
    esmExternals: true,
    webpackBuildWorker: false
  },
  
  // Improved webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Disable all minimizers
    config.optimization.minimize = false;
    
    // Use named modules for easier debugging
    config.optimization.moduleIds = 'named';
    config.optimization.chunkIds = 'named';
    
    // Use a simpler source map strategy that doesn't require Terser
    if (!isServer) {
      config.devtool = 'nosources-source-map';
    }
    
    // Special handling for CSS files
    const cssRules = config.module.rules.find(rule => 
      rule.oneOf && rule.oneOf.find(r => r.test && r.test.toString().includes('css'))
    ).oneOf;
    
    // Modify CSS rules to avoid parsing errors
    cssRules.forEach(rule => {
      if (rule.test && rule.test.toString().includes('css')) {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use.forEach(loader => {
            if (loader.options && loader.options.postcssOptions) {
              // Simplify PostCSS processing
              loader.options.postcssOptions = {
                ...loader.options.postcssOptions,
                plugins: [
                  ["autoprefixer", {}]
                ]
              };
            }
          });
        }
      }
    });
    
    return config;
  },
  
  // Environment variables for build
  env: {
    PERPLEXITY_API_KEY: "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",
    NEXT_PUBLIC_PERPLEXITY_API_KEY: "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"
  }
}

module.exports = nextConfig