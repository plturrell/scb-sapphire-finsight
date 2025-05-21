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
      // Disable Terser but keep source maps
      config.optimization.minimize = false;
      
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