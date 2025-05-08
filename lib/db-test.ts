import { neon } from "@neondatabase/serverless"
import { AppError, ErrorType } from "./error-handling"
import { validateDatabaseUrl, sanitizeDatabaseUrl } from "./db-config"

// Function to test database connection without using cache
export async function testDatabaseConnectionWithoutCache() {
  try {
    // Check if DATABASE_URL is defined
    if (!process.env.DATABASE_URL) {
      return {
        success: false,
        message: "Database connection string is missing",
        error: "DATABASE_URL environment variable is not defined",
        type: ErrorType.DATABASE_CONNECTION,
      }
    }

    // Validate database URL format
    if (!validateDatabaseUrl(process.env.DATABASE_URL)) {
      return {
        success: false,
        message: "Invalid database URL format",
        error: "The DATABASE_URL does not appear to be a valid PostgreSQL connection string",
        type: ErrorType.DATABASE_CONNECTION,
      }
    }

    // Create a direct neon client for testing only
    const testClient = neon(process.env.DATABASE_URL)

    // Use a timeout promise to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Database connection timed out"))
      }, 10000) // 10 seconds timeout
    })

    try {
      // Race the database query against the timeout
      const result = await Promise.race([
        testClient`SELECT current_timestamp as timestamp, current_database() as database_name, version() as postgres_version`,
        timeoutPromise,
      ])

      // Return success with database details
      return {
        success: true,
        message: "Database connection successful",
        details: {
          timestamp: result[0].timestamp,
          database: result[0].database_name,
          version: result[0].postgres_version,
          connection_url: sanitizeDatabaseUrl(process.env.DATABASE_URL),
        },
      }
    } catch (fetchError) {
      // Handle fetch errors specifically
      console.error("Database connection test failed:", fetchError)

      return {
        success: false,
        message: "Failed to connect to database",
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        type: ErrorType.DATABASE_CONNECTION,
        details: {
          connection_url: sanitizeDatabaseUrl(process.env.DATABASE_URL),
          available_env_vars: Object.keys(process.env)
            .filter((key) => key.includes("DATABASE") || key.includes("POSTGRES"))
            .join(", "),
        },
      }
    }
  } catch (error) {
    // Handle any other errors
    console.error("Database connection test error:", error)

    return {
      success: false,
      message: "Error testing database connection",
      error: error instanceof Error ? error.message : "Unknown database connection error",
      type: error instanceof AppError ? error.type : ErrorType.SERVER,
    }
  }
}
