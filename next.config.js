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
  
  // Use the SWC minifier instead of Terser
  swcMinify: true,
  
  // Completely disable optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Disable Terser
      config.optimization.minimize = false;
      
      // Use named modules for easier debugging
      config.optimization.moduleIds = 'named';
      config.optimization.chunkIds = 'named';
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