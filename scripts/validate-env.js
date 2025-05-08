// Simple script to validate environment variables before build
console.log("Validating environment variables...")

const requiredVars = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING"]

// Check if at least one database URL is available
const hasDbUrl = requiredVars.some((varName) => {
  const value = process.env[varName]
  return value && value.trim() !== ""
})

if (!hasDbUrl) {
  console.error("ERROR: No database connection URL found in environment variables.")
  console.error("Please set at least one of the following:")
  console.error(requiredVars.join(", "))
  process.exit(1)
}

console.log("Environment variables validation passed.")
