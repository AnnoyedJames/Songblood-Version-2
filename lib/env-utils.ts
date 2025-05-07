/**
 * Utility functions for environment detection and configuration
 */

/**
 * Checks if the application is running in a preview environment
 * This includes Vercel preview deployments and local development
 */
export function isPreviewEnvironment(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development"
  )
}

/**
 * Checks if the application is running in a production environment
 */
export function isProductionEnvironment(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
}

/**
 * Gets the current environment name
 */
export function getEnvironmentName(): string {
  if (isPreviewEnvironment()) {
    return "preview"
  } else if (isProductionEnvironment()) {
    return "production"
  } else {
    return "development"
  }
}

/**
 * Checks if a feature flag is enabled
 * @param flagName The name of the feature flag
 */
export function isFeatureEnabled(flagName: string): boolean {
  const flag = process.env[`FEATURE_${flagName.toUpperCase()}`]
  return flag === "true" || flag === "1"
}
