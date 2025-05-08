import { neon, neonConfig } from "@neondatabase/serverless"

// Configure Neon with optimal settings for reliability
neonConfig.fetchRetryTimeout = 10000 // 10 seconds timeout
neonConfig.fetchRetryCount = 3 // Retry 3 times
neonConfig.wsConnectionTimeoutMs = 10000 // 10 seconds WebSocket timeout

// Track connection errors for reporting
let CONNECTION_ERROR_MESSAGE = ""

// Function to validate database URL
export function isValidDatabaseUrl(url: string): boolean {
  try {
    // Check if URL has the correct format for Postgres
    if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
      // Validate by parsing the URL
      new URL(url)
      return true
    }
    return false
  } catch (error) {
    console.error("Invalid database URL format:", error)
    return false
  }
}

// Function to validate and get the best available database URL
export function getBestDatabaseUrl(): string | null {
  // Log all available environment variables for debugging (without exposing values)
  console.log("Available database environment variables:", {
    DATABASE_URL: !!process.env.DATABASE_URL,
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
  })

  // Try DATABASE_URL first
  if (process.env.DATABASE_URL && isValidDatabaseUrl(process.env.DATABASE_URL)) {
    console.log("Using DATABASE_URL")
    return process.env.DATABASE_URL
  }

  // Try POSTGRES_URL as fallback
  if (process.env.POSTGRES_URL && isValidDatabaseUrl(process.env.POSTGRES_URL)) {
    console.log("Using POSTGRES_URL as fallback")
    return process.env.POSTGRES_URL
  }

  // Try POSTGRES_PRISMA_URL as another fallback
  if (process.env.POSTGRES_PRISMA_URL && isValidDatabaseUrl(process.env.POSTGRES_PRISMA_URL)) {
    console.log("Using POSTGRES_PRISMA_URL as fallback")
    return process.env.POSTGRES_PRISMA_URL
  }

  // Try non-pooling URL as last resort
  if (process.env.POSTGRES_URL_NON_POOLING && isValidDatabaseUrl(process.env.POSTGRES_URL_NON_POOLING)) {
    console.log("Using POSTGRES_URL_NON_POOLING as fallback")
    return process.env.POSTGRES_URL_NON_POOLING
  }

  console.error("No valid database URL found in environment variables")
  return null
}

// Get the best available database URL
const dbUrl = getBestDatabaseUrl()

// Initialize the neon client once with the best available URL
export const dbClient = dbUrl ? neon(dbUrl) : null

// If we found a valid URL but it's not in DATABASE_URL, set it there for compatibility
if (dbUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = dbUrl
  console.log("Set DATABASE_URL from alternative source")
}

// Flag to track if we're in fallback mode
export let IS_FALLBACK_MODE = !dbClient

// Function to get connection error message
export function getConnectionErrorMessage() {
  return CONNECTION_ERROR_MESSAGE
}

// Function to set connection error message
export function setConnectionErrorMessage(message: string) {
  CONNECTION_ERROR_MESSAGE = message
}

// Function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  if (!dbClient) {
    IS_FALLBACK_MODE = true
    setConnectionErrorMessage("Database client not initialized")
    return false
  }

  try {
    await dbClient`SELECT 1`
    IS_FALLBACK_MODE = false
    return true
  } catch (error) {
    console.error("Database connection check failed:", error)
    IS_FALLBACK_MODE = true
    setConnectionErrorMessage(error instanceof Error ? error.message : String(error))
    return false
  }
}

// Initialize database connection on module load
checkDatabaseConnection()
  .then((connected) => {
    if (connected) {
      console.log("Database connection test successful")
      IS_FALLBACK_MODE = false
    } else {
      console.warn("Database connection failed. Application will show error messages to users.")
      IS_FALLBACK_MODE = true
    }
  })
  .catch((error) => {
    console.error("Unexpected error during database initialization:", error)
    setConnectionErrorMessage(error instanceof Error ? error.message : String(error))
    IS_FALLBACK_MODE = true
  })
