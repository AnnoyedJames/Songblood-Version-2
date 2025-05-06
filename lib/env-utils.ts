/**
 * Safely access environment variables
 * This utility prevents client-side access to server-only environment variables
 */

// Check if we're running on the client
const isClient = typeof window !== "undefined"

/**
 * Safely get an environment variable
 * Returns undefined if the variable doesn't exist or if trying to access server-only variables on the client
 */
export function getEnvVariable(key: string): string | undefined {
  // If we're on the client and the variable isn't prefixed with NEXT_PUBLIC_, return undefined
  if (isClient && !key.startsWith("NEXT_PUBLIC_")) {
    console.warn(`Attempted to access server-only environment variable '${key}' on the client`)
    return undefined
  }

  return process.env[key]
}

/**
 * Check if we're in a development or preview environment
 */
export function isDevOrPreview(): boolean {
  // Always consider it a development environment on the client
  if (isClient) return true

  const nodeEnv = process.env.NODE_ENV
  const vercelEnv = process.env.VERCEL_ENV

  return nodeEnv !== "production" || vercelEnv === "preview" || vercelEnv === "development"
}

/**
 * Get the database URL safely
 */
export function getDatabaseUrl(): string | undefined {
  // Only attempt to access on the server
  if (isClient) return undefined

  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
}
