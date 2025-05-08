/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React strict mode to prevent double rendering in development
  reactStrictMode: false,
  
  // Generate full source maps for better debugging
  productionBrowserSourceMaps: true,
  
  // Disable code minification for better debugging
  swcMinify: false,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  
  // Configure webpack to preserve class names and function names
  webpack: (config, { dev, isServer }) => {
    // Disable optimization in development for better debugging
    if (dev) {
      config.optimization.minimize = false
      
      // Preserve function and class names
      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              keep_classnames: true,
              keep_fnames: true,
            }
          }
        })
      }
    }
    
    return config
  },
  
  // Increase the timeout for API routes
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
}

export default nextConfig
