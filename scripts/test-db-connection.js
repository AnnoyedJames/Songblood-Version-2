/**
 * Pre-build database connection test script
 * Tests database connection before building to catch issues early
 */

// Only test in production builds
if (process.env.NODE_ENV === "production") {
  console.log("🔍 Testing database connection before build...")

  // Get database URL from environment variables
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!dbUrl) {
    console.warn("⚠️ No database URL found. Skipping connection test.")
    // Don't fail the build, as we have fallbacks
    process.exit(0)
  }

  // Import the neon client
  const { neon } = require("@neondatabase/serverless")

  // Create a client with a short timeout
  const sql = neon(dbUrl)

  // Test the connection with a timeout
  const testConnection = async () => {
    try {
      // Set a timeout of 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection test timed out after 10 seconds")), 10000)
      })

      // Run a simple query
      const queryPromise = sql`SELECT 1 as connection_test`

      // Race the query against the timeout
      await Promise.race([queryPromise, timeoutPromise])

      console.log("✅ Database connection successful!")
      process.exit(0)
    } catch (error) {
      console.error("❌ Database connection test failed:", error.message)
      console.warn("⚠️ Build will continue, but application may use fallback data")
      // Don't fail the build, as we have fallbacks
      process.exit(0)
    }
  }

  testConnection()
} else {
  console.log("🔍 Skipping database connection test in development mode")
  process.exit(0)
}
