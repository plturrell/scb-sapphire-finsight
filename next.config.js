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
  
  // Webpack configuration with source maps
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Completely disable Terser and minification
      config.optimization.minimize = false;
      config.optimization.minimizer = [];
      
      // Use named modules for easier debugging
      config.optimization.moduleIds = 'named';
      config.optimization.chunkIds = 'named';
      
      // Set proper source map type based on environment
      config.devtool = dev ? 'eval-source-map' : 'source-map';
    }
    
    return config;
  },
  
  // Generate a standalone build
  output: 'standalone',
  
  // Environment variables for build
  env: {
    PERPLEXITY_API_KEY: "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",
    NEXT_PUBLIC_PERPLEXITY_API_KEY: "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"
  }
}

module.exports = nextConfig