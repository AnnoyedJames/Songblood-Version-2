/**
 * Environment variable utilities
 * Provides consistent access to environment variables with validation and defaults
 */

// Get environment variable with validation and default value
export const getEnvVar = (key: string, defaultValue = ""): string => {
  const value = process.env[key]
  if (!value && process.env.NODE_ENV === "production") {
    console.warn(`Environment variable ${key} is not set, using default value`)
    return defaultValue
  }
  return value || defaultValue
}

// Get database URL from available environment variables
export const getDatabaseUrl = (): string => {
  // Try each database URL environment variable in order of preference
  const dbUrl =
    getEnvVar("DATABASE_URL") ||
    getEnvVar("POSTGRES_URL") ||
    getEnvVar("POSTGRES_PRISMA_URL") ||
    getEnvVar("POSTGRES_URL_NON_POOLING")

  if (!dbUrl && process.env.NODE_ENV === "production") {
    console.error("No database URL environment variable found. Database functionality will be unavailable.")
  }

  return dbUrl
}

// Check if running in production environment
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production"
}

// Check if running in development environment
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development"
}

// Check if running in Vercel environment
export const isVercel = (): boolean => {
  return !!process.env.VERCEL
}

// Get current Vercel environment (production, preview, development)
export const getVercelEnv = (): string => {
  return getEnvVar("NEXT_PUBLIC_VERCEL_ENV", "development")
}

// Get base URL for the application
export const getBaseUrl = (): string => {
  if (isVercel()) {
    // Handle Vercel deployments
    const vercelUrl = getEnvVar("VERCEL_URL", "")
    if (vercelUrl) {
      return `https://${vercelUrl}`
    }
  }

  // Fallback to environment variable or localhost
  return getEnvVar("NEXT_PUBLIC_BASE_URL", "http://localhost:3000")
}
