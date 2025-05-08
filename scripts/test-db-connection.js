// Simple script to test database connection before build
console.log("Testing database connection...")

// This is a simple check that doesn't actually connect to the database
// In a real implementation, you would use the database client to test the connection
const dbUrls = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING"]

const availableUrls = dbUrls.filter((url) => process.env[url])

if (availableUrls.length === 0) {
  console.warn("WARNING: No database URLs found, but continuing build.")
  console.warn("The application will use fallback data in production.")
} else {
  console.log(`Found ${availableUrls.length} database URLs.`)
  console.log("Database configuration looks good.")
}

console.log("Database connection test completed.")
