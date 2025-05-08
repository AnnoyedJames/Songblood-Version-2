/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable code minification/optimization for debugging
  swcMinify: false,

  // Disable React strict mode for debugging
  reactStrictMode: false,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Generate full source maps for better debugging
  webpack: (config, { dev, isServer }) => {
    // Always generate source maps, even in production
    if (!dev) {
      config.devtool = "source-map"
    }

    // Disable minimization for all environments
    config.optimization.minimize = false

    // Disable name mangling to preserve original variable names
    if (config.optimization.minimizer) {
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === "TerserPlugin") {
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            compress: false,
            mangle: false,
            keep_classnames: true,
            keep_fnames: true,
          }
        }
      })
    }

    return config
  },

  // Preserve original class names and function names
  experimental: {
    // Disable optimizations that might obscure code
    optimizeCss: false,
    optimizePackageImports: false,
  },
}

module.exports = nextConfig
