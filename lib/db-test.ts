import { neon } from "@neondatabase/serverless"
import { isUsingFallbackMode } from "./db-config"
import { getDatabaseUrl } from "./env-utils"

/**
 * Test the database connection without using the cache
 */
async function testDatabaseConnectionWithoutCache(): Promise<{ success: boolean; message: string }> {
  // Skip actual connection test in fallback mode
  if (isUsingFallbackMode()) {
    return {
      success: true,
      message: "Using development/preview mode with simulated data",
    }
  }

  try {
    const dbUrl = getDatabaseUrl()

    if (!dbUrl) {
      return {
        success: false,
        message: "Database configuration missing",
      }
    }

    const sql = neon(dbUrl)
    await sql`SELECT 1 as connection_test`

    return {
      success: true,
      message: "Successfully connected to the database",
    }
  } catch (error: any) {
    console.error("Database connection test failed:", error)

    return {
      success: false,
      message: `Error connecting to database: ${error.message || "Unknown error"}`,
    }
  }
}

export async function testDatabaseConnection(): Promise<{ success: boolean; message: string }> {
  return testDatabaseConnectionWithoutCache()
}
