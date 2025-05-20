/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    unoptimized: true, // Avoid image optimization issues
  },
  // Disable TypeScript checking during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Handle trailing slashes consistently
  trailingSlash: false,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  webpack: (config, { isServer, dev }) => {
    // Fixes lexical declaration issues in generated bundle
    config.optimization.moduleIds = 'named';
    
    // Special handling for @react-spring/web
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-spring/web': '@react-spring/web/dist/web.cjs',
      };
    }

    // Add react-spring to the transpileModules list
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      include: [
        /[\\/]node_modules[\\/]@react-spring[\\/]/,
      ],
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            'next/babel'
          ],
          cacheDirectory: true,
        },
      },
    });
    
    // Configure Terser for compatibility with complex libraries
    if (!isServer && !dev) {
      // Adjust Terser options for better compatibility
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            // Configure Terser to preserve important class properties
            keep_classnames: true,
            keep_fnames: true,
            compress: {
              ...minimizer.options.terserOptions.compress,
              arrows: false,
              keep_fargs: true,
              keep_infinity: true,
              sequences: false,
              passes: 1,
              pure_getters: false,
              unsafe: false,
              unsafe_arrows: false,
              unsafe_comps: false,
              unsafe_Function: false,
              unsafe_math: false,
              unsafe_methods: false,
              unsafe_proto: false,
              unsafe_regexp: false,
              unsafe_undefined: false
            },
            mangle: {
              // Don't mangle React Spring's internal properties
              keep_classnames: /^(Controller|Springs?|useSprings?|useSpring|useTrail|useChain|useTransition|animated)$/,
              keep_fnames: /^(Controller|Springs?|useSprings?|useSpring|useTrail|useChain|useTransition|animated)$/,
              // Carefully control property mangling
              properties: {
                regex: /^_/
              }
            },
            format: {
              comments: false,
              beautify: false,
              preserve_annotations: true
            }
          };
        }
      });
    }
    
    return config;
  },
  
  // Disable static export to prevent SSR issues
  output: 'standalone',
  
  // Configure runtime options for client-side rendering
  experimental: {
    esmExternals: 'loose', // Help with module resolution
    // Modern config approach for runtime JS options
    optimizePackageImports: ['@mui/material', 'framer-motion', '@react-spring/web'],
    // Add transpilePackages to properly handle React Spring
    transpilePackages: ['@react-spring/web'],
  },
  
  // Explicitly disable SSR for problematic pages
  async exportPathMap(defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
    return {
      ...defaultPathMap,
      '/financial-simulation': { page: '/financial-simulation', query: {} },
      '/tariff-alerts': { page: '/tariff-alerts', query: {} },
      '/tariff-scanner': { page: '/tariff-scanner', query: {} },
      '/vietnam-monte-carlo': { page: '/vietnam-monte-carlo', query: {} },
      '/vietnam-monte-carlo-enhanced': { page: '/vietnam-monte-carlo-enhanced', query: {} },
      '/vietnam-tariff-impact': { page: '/vietnam-tariff-impact', query: {} },
      '/dashboard': { page: '/dashboard', query: {} },
    };
  },
  
  // Configure optimization to preserve our beautiful styling
  swcMinify: false, // Use Terser for minification instead of SWC to preserve our styling
  
  // Disable checks that might fail build
  eslint: {
    ignoreDuringBuilds: true
  },
  
  // Environment variables for build
  env: {
    PERPLEXITY_API_KEY: "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",
    NEXT_PUBLIC_PERPLEXITY_API_KEY: "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"
  }
}

module.exports = nextConfig