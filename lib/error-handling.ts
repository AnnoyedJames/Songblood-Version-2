// Error types for the application
export enum ErrorType {
  DATABASE_CONNECTION = "DATABASE_CONNECTION",
  AUTHENTICATION = "AUTHENTICATION",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION = "VALIDATION",
  SERVER = "SERVER",
  NAVIGATION = "NAVIGATION", // Added for redirect errors
}

// Error messages for users
export const ErrorMessages = {
  [ErrorType.DATABASE_CONNECTION]: "Unable to connect to the database. Please try again later.",
  [ErrorType.AUTHENTICATION]: "Authentication failed. Please check your credentials and try again.",
  [ErrorType.NOT_FOUND]: "The requested resource was not found.",
  [ErrorType.VALIDATION]: "Please check your input and try again.",
  [ErrorType.SERVER]: "An unexpected error occurred. Please try again later.",
  [ErrorType.NAVIGATION]: "Navigation error. Please try again or return to the home page.",
}

// Error class for application errors
export class AppError extends Error {
  type: ErrorType
  details?: string

  constructor(type: ErrorType, message?: string, details?: string) {
    super(message || ErrorMessages[type])
    this.type = type
    this.details = details
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

    // Convert to AppError with appropriate type
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("connection") ||
      error.message.includes("ECONNREFUSED")
    ) {
      return new AppError(ErrorType.DATABASE_CONNECTION, undefined, error.message)
    }

    return new AppError(ErrorType.SERVER, undefined, error.message)
  }

  // Handle unknown errors
  console.error(`${prefix}Unknown error:`, error)
  return new AppError(ErrorType.SERVER, undefined, String(error))
}
