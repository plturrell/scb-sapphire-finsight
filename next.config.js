/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Basic configuration
  images: {
    domains: [],
    unoptimized: true, // Avoid image optimization issues
  },
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint errors during build
  },
  
  // Prevent production optimizations
  swcMinify: false, // Don't use SWC minification
  optimizeFonts: false, // Don't optimize fonts
  productionBrowserSourceMaps: false, // No source maps in production
  
  // Force production to behave like development
  webpack: (config, { isServer, dev }) => {
    // Force development mode for client-side bundle
    if (!isServer) {
      // Force development mode to skip Terser entirely
      config.mode = 'development';
      
      // Completely disable minimization
      config.optimization.minimize = false;
      config.optimization.minimizer = [];
      
      // Disable other optimizations that could cause issues
      config.optimization.splitChunks = { cacheGroups: {} };
      config.optimization.concatenateModules = false;
      config.optimization.usedExports = false;
      
      // Use named chunks for better debugging
      config.optimization.moduleIds = 'named';
      config.optimization.chunkIds = 'named';
    }
    
    return config;
  },
  
  // Generate a standalone build for better compatibility
  output: 'standalone',
  
  // Experimental features
  experimental: {
    // Better compatibility for ESM packages
    esmExternals: 'loose',
    // Optimize specific large packages
    optimizePackageImports: ['@mui/material', 'framer-motion'],
  },
  
  // Environment variables for build
  env: {
    PERPLEXITY_API_KEY: "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",
    NEXT_PUBLIC_PERPLEXITY_API_KEY: "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",
    
    // Force environment in next.js
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
}

module.exports = nextConfig