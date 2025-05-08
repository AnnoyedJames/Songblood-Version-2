/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false, // Disable minification for better debugging
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Keep source maps in production for better debugging
    if (!dev) {
      config.devtool = 'source-map'
    }
    
    // Disable code optimization in development for faster builds
    if (dev) {
      config.optimization.minimize = false
      config.optimization.minimizer = []
    }
    
    // Preserve class names and function names in production
    config.optimization.moduleIds = 'named'
    config.optimization.chunkIds = 'named'
    
    return config
  },
}

export default nextConfig
