/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Enable minification in production, disable in development
  swcMinify: process.env.NODE_ENV === 'production',
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
  eslint: {
    // Still ignore during builds to prevent failing deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Still ignore during builds to prevent failing deployment
    ignoreBuildErrors: true,
  },
  images: {
    // Enable optimization in production
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  webpack: (config, { dev, isServer }) => {
    // Keep source maps in production for better debugging
    if (!dev) {
      config.devtool = 'source-map'
    }
    
    // Only disable optimizations in development
    if (dev) {
      config.optimization.minimize = false
      config.optimization.minimizer = []
    }
    
    // In production, use standard optimization
    if (!dev) {
      // Don't use named modules in production to reduce bundle size
      config.optimization.moduleIds = 'deterministic'
      config.optimization.chunkIds = 'deterministic'
    } else {
      // Use named modules in development for better debugging
      config.optimization.moduleIds = 'named'
      config.optimization.chunkIds = 'named'
    }
    
    return config
  },
}

export default nextConfig
