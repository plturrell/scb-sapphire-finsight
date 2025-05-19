/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Disable TypeScript checking during build for deployment
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Handle trailing slashes consistently
  trailingSlash: false,
  // Optimize production builds
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig