// Database configuration file to centralize database settings
import { neonConfig } from "@neondatabase/serverless"

// Database configuration constants
export const DB_CONFIG = {
  CONNECTION_TIMEOUT_MS: 60000, // 60 seconds
  MAX_CONNECTION_TIME_MS: 120000, // 2 minutes maximum connection time
  RETRY_COUNT: 3,
  RETRY_DELAY_MS: 2000, // 2 seconds
  CONNECTION_POOL_SIZE: 10,
  QUERY_CACHE_TTL_SECONDS: 60, // Cache TTL in seconds
}

// Configure Neon with optimal settings
export function configureNeon() {
  // Set timeout for fetch operations
  neonConfig.fetchRetryTimeout = DB_CONFIG.CONNECTION_TIMEOUT_MS

  // Set retry count for failed operations
  neonConfig.fetchRetryCount = DB_CONFIG.RETRY_COUNT

  // Set WebSocket connection timeout
  neonConfig.wsConnectionTimeoutMs = DB_CONFIG.CONNECTION_TIMEOUT_MS

  // Log configuration for debugging
  console.log("Neon database configuration initialized with the following settings:")
  console.log(
    `- Connection timeout: ${DB_CONFIG.CONNECTION_TIMEOUT_MS}ms (${DB_CONFIG.CONNECTION_TIMEOUT_MS / 1000} seconds)`,
  )
  console.log(
    `- Max connection time: ${DB_CONFIG.MAX_CONNECTION_TIME_MS}ms (${DB_CONFIG.MAX_CONNECTION_TIME_MS / 1000} seconds)`,
  )
  console.log(`- Retry count: ${DB_CONFIG.RETRY_COUNT}`)
  console.log(`- Retry delay: ${DB_CONFIG.RETRY_DELAY_MS}ms`)
  console.log(`- WebSocket timeout: ${DB_CONFIG.CONNECTION_TIMEOUT_MS}ms`)
}

// Function to get the database URL from environment variables
export function getDatabaseUrl(): string {
  // Try each database URL environment variable in order of preference
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!dbUrl && process.env.NODE_ENV === "production") {
    console.error("No database URL environment variable found. Database functionality will be unavailable.")
  }

  return dbUrl || ""
}

// Validate database URL format
export function validateDatabaseUrl(url: string | undefined): boolean {
  if (!url) return false

  try {
    // Check if URL has the correct format for Postgres
    return url.startsWith("postgres://") || url.startsWith("postgresql://")
  } catch (error) {
    console.error("Invalid database URL format:", error)
    return false
  }
}

// Parse and sanitize database URL for logging (hide credentials)
export function sanitizeDatabaseUrl(url: string | undefined): string {
  if (!url) return "undefined"

  try {
    const dbUrl = new URL(url)
    // Hide password for security
    dbUrl.password = "********"
    return dbUrl.toString()
  } catch (error) {
    return "invalid-url-format"
  }
}

// Function to create optimized query parameters
export function createQueryParams(params: Record<string, any>): string {
  return Object.entries(params)
    .map(([key, value]) => {
      // Handle arrays, objects, and null values
      if (value === null) {
        return `${encodeURIComponent(key)}=null`
      } else if (Array.isArray(value)) {
        return `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`
      } else if (typeof value === "object") {
        return `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`
      } else {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      }
    })
    .join("&")
}
