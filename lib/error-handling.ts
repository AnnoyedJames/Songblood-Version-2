// Define error types for better categorization
export enum ErrorType {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NOT_FOUND = "not_found",
  DATABASE_CONNECTION = "database_connection",
  DATABASE_QUERY = "database_query",
  SERVER = "server",
  NETWORK = "network",
  NAVIGATION = "navigation",
  UNKNOWN = "unknown",
}

// Custom application error class
export class AppError extends Error {
  type: ErrorType
  details?: string
  retryable?: boolean

  constructor(type: ErrorType, message: string, details?: string, retryable = false) {
    super(message)
    this.name = "AppError"
    this.type = type
    this.details = details
    this.retryable = retryable
  }
}

// Log errors with consistent format
export function logError(error: unknown, context: string): AppError {
  // Convert to AppError if it's not already
  const appError =
    error instanceof AppError
      ? error
      : new AppError(
          ErrorType.UNKNOWN,
          error instanceof Error ? error.message : "An unknown error occurred",
          error instanceof Error ? error.stack : undefined,
        )

  // Log with context
  console.error(`[${context}] ${appError.type}: ${appError.message}`, {
    details: appError.details,
    stack: appError.stack,
  })

  return appError
}

// Convert technical error messages to user-friendly messages
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        return "Your session has expired or is invalid. Please log in again."
      case ErrorType.AUTHORIZATION:
        return "You don't have permission to perform this action."
      case ErrorType.VALIDATION:
        return error.message || "The information you provided is invalid."
      case ErrorType.NOT_FOUND:
        return "The requested resource could not be found."
      case ErrorType.DATABASE_CONNECTION:
        return "We're having trouble connecting to the database. Please try again later."
      case ErrorType.DATABASE_QUERY:
        return "There was an issue retrieving the data. Please try again."
      case ErrorType.NETWORK:
        return "Network connection issue. Please check your internet connection and try again."
      case ErrorType.NAVIGATION:
        return "There was a problem navigating to the requested page."
      default:
        return "An unexpected error occurred. Please try again later."
    }
  }

  // Handle standard errors
  if (error instanceof Error) {
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return "Network connection issue. Please check your internet connection and try again."
    }
    if (error.message.includes("timeout")) {
      return "The request timed out. Please try again later."
    }
    if (error.message.includes("database") || error.message.includes("sql")) {
      return "We're having trouble with our database. Please try again later."
    }
    return "An unexpected error occurred. Please try again later."
  }

  // Default message for unknown errors
  return "Something went wrong. Please try again later."
}
