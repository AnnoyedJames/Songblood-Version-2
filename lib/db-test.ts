import { neon, neonConfig } from "@neondatabase/serverless"
import { logError } from "./error-handling"

/**
 * Utility function to test database connection without using fetchConnectionCache
 * This is used to verify that the application works correctly after removing the deprecated option
 */
export async function testDatabaseConnectionWithoutCache(): Promise<{
  success: boolean
  message: string
  latency?: number
}> {
  try {
    console.log("Testing database connection with current configuration:")
    console.log(`- fetchRetryTimeout: ${neonConfig.fetchRetryTimeout}ms`)
    console.log(`- fetchRetryCount: ${neonConfig.fetchRetryCount}`)
    console.log(`- wsConnectionTimeoutMs: ${neonConfig.wsConnectionTimeoutMs}ms`)

    // Check if DATABASE_URL is defined
    if (!process.env.DATABASE_URL) {
      return {
        success: false,
        message: "DATABASE_URL environment variable is not defined",
      }
    }

    const dbClient = neon(process.env.DATABASE_URL)

    // Measure query latency
    const startTime = Date.now()

    // Execute a simple query using tagged template literal
    const result = await dbClient`SELECT 1 as connection_test`

    const endTime = Date.now()
    const latency = endTime - startTime

    return {
      success: true,
      message: "Database connection successful",
      latency,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(error, "Database Connection Test")

    return {
      success: false,
      message: `Database connection failed: ${errorMessage}`,
    }
  }
}
