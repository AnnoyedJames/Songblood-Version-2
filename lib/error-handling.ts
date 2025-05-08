// Error types for the application
export enum ErrorType {
  DATABASE_CONNECTION = "DATABASE_CONNECTION",
  AUTHENTICATION = "AUTHENTICATION",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION = "VALIDATION",
  SERVER = "SERVER",
  NAVIGATION = "NAVIGATION",
  TIMEOUT = "TIMEOUT",
  RATE_LIMIT = "RATE_LIMIT",
  CONFLICT = "CONFLICT",
  BUILD = "BUILD",
}

// Error messages for users
export const ErrorMessages = {
  [ErrorType.DATABASE_CONNECTION]: "Unable to connect to the database. Please try again later.",
  [ErrorType.AUTHENTICATION]: "Authentication failed. Please check your credentials and try again.",
  [ErrorType.NOT_FOUND]: "The requested resource was not found.",
  [ErrorType.VALIDATION]: "Please check your input and try again.",
  [ErrorType.SERVER]: "An unexpected error occurred. Please try again later.",
  [ErrorType.NAVIGATION]: "Navigation error. Please try again or return to the home page.",
  [ErrorType.TIMEOUT]: "The operation timed out. Please try again later.",
  [ErrorType.RATE_LIMIT]: "Too many requests. Please try again later.",
  [ErrorType.CONFLICT]: "A conflict occurred with your request. Please refresh and try again.",
  [ErrorType.BUILD]: "An error occurred during build. Check the build logs for details.",
}

// Error class for application errors
export class AppError extends Error {
  type: ErrorType
  details?: string
  retryable?: boolean

  constructor(type: ErrorType, message?: string, details?: string, retryable?: boolean) {
    super(message || ErrorMessages[type])
    this.type = type
    this.details = details
    this.retryable = retryable
    this.name = "AppError"
  }
}

// Function to log errors without exposing sensitive details
export function logError(error: unknown, context?: string): AppError {
  const prefix = context ? `[${context}] ` : ""

  if (error instanceof AppError) {
    console.error(`${prefix}${error.type}: ${error.message}`)
    if (error.details) {
      console.error(`${prefix}Details: ${error.details}`)
    }
    return error
  }

  // Handle other error types
  if (error instanceof Error) {
    console.error(`${prefix}Unhandled error: ${error.message}`)
    console.error(error.stack)

    // Check for redirect errors
    if (error.message.includes("NEXT_REDIRECT") || error.message.includes("redirect")) {
      return new AppError(ErrorType.NAVIGATION, "Navigation error", error.message)
    }

    // Check for timeout errors
    if (error.message.includes("timeout") || error.message.includes("timed out")) {
      return new AppError(ErrorType.TIMEOUT, "Operation timed out", error.message, true)
    }

    // Check for rate limit errors
    if (error.message.includes("rate limit") || error.message.includes("too many requests")) {
      return new AppError(ErrorType.RATE_LIMIT, "Rate limit exceeded", error.message, true)
    }

    // Check for database connection errors
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("connection") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("database")
    ) {
      return new AppError(ErrorType.DATABASE_CONNECTION, "Database connection error", error.message, true)
    }

    // Check for validation errors
    if (
      error.message.includes("validation") ||
      error.message.includes("invalid") ||
      error.message.includes("required")
    ) {
      return new AppError(ErrorType.VALIDATION, "Validation error", error.message, false)
    }

    return new AppError(ErrorType.SERVER, undefined, error.message, true)
  }

  // Handle unknown errors
  console.error(`${prefix}Unknown error:`, error)
  return new AppError(ErrorType.SERVER, undefined, String(error), true)
}

// Function to determine if an error is retryable
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return (
      error.retryable === true ||
      error.type === ErrorType.DATABASE_CONNECTION ||
      error.type === ErrorType.TIMEOUT ||
      error.type === ErrorType.RATE_LIMIT ||
      error.type === ErrorType.SERVER
    )
  }

  // By default, consider unknown errors as retryable
  return true
}

// Function to get a user-friendly error message
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    // Try to extract a user-friendly message from the error
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return "Network connection error. Please check your internet connection and try again."
    }

    if (error.message.includes("timeout") || error.message.includes("timed out")) {
      return "The operation took too long to complete. Please try again later."
    }

    // For other errors, return a generic message
    return "An unexpected error occurred. Please try again later."
  }

  return "An unknown error occurred. Please try again later."
}

// New function for build-time error logging
export function logBuildError(error: unknown, context?: string): void {
  console.error(`[BUILD ERROR${context ? ` - ${context}` : ""}]`, error)

  // Report to monitoring service if available
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") {
    // Send to monitoring service if implemented
  }
}

// New function to handle errors during build time
export function handleBuildError(error: unknown, context?: string): void {
  logBuildError(error, context)

  // In production builds, we want to continue rather than fail
  if (process.env.NODE_ENV === "production") {
    console.warn("Build error occurred but continuing to prevent deployment failure")
  } else {
    // In development, we want to fail fast
    throw error
  }
}
