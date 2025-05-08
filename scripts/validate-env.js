/**
 * Pre-build environment variable validation script
 * Checks for required environment variables before building
 */

// List of required environment variables for production builds
const REQUIRED_ENV_VARS = [
  // At least one database URL is required
  {
    name: "Database URL",
    vars: ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING"],
    required: true,
    atLeastOne: true,
  },
  // Base URL is recommended but not required
  {
    name: "Base URL",
    vars: ["NEXT_PUBLIC_BASE_URL"],
    required: false,
  },
]

// Only validate in production builds
if (process.env.NODE_ENV === "production") {
  console.log("🔍 Validating environment variables for production build...")

  let hasErrors = false

  // Check each group of environment variables
  REQUIRED_ENV_VARS.forEach((group) => {
    if (group.atLeastOne) {
      // Check if at least one variable in the group is defined
      const definedVar = group.vars.find((varName) => !!process.env[varName])

      if (!definedVar && group.required) {
        console.error(`❌ Error: At least one of these environment variables is required: ${group.vars.join(", ")}`)
        hasErrors = true
      } else if (!definedVar) {
        console.warn(`⚠️ Warning: None of these recommended environment variables are set: ${group.vars.join(", ")}`)
      } else {
        console.log(`✅ Found ${group.name}: ${definedVar}`)
      }
    } else {
      // Check each variable individually
      group.vars.forEach((varName) => {
        if (!process.env[varName] && group.required) {
          console.error(`❌ Error: Required environment variable ${varName} is not set`)
          hasErrors = true
        } else if (!process.env[varName]) {
          console.warn(`⚠️ Warning: Recommended environment variable ${varName} is not set`)
        } else {
          console.log(`✅ Found ${varName}`)
        }
      })
    }
  })

  // Exit with error if any required variables are missing
  if (hasErrors) {
    console.error("❌ Environment validation failed. Fix the errors above before deploying.")
    process.exit(1)
  }

  console.log("✅ Environment validation passed!")
} else {
  console.log("🔍 Skipping environment validation in development mode")
}
