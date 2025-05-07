/**
 * Error types for the application
 */
export enum ErrorType {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  DATABASE_CONNECTION = "database_connection",
  NOT_FOUND = "not_found",
  VALIDATION = "validation",
  UNKNOWN = "unknown",
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  type: ErrorType
  details?: any

  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, details?: any) {
    super(message)
    this.name = "AppError"
    this.type = type
    this.details = details
  }
}

/**
 * Handles errors in a consistent way
 */
export function handleError(error: unknown): { message: string; type: ErrorType } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      type: error.type,
    }
  }

  if (error instanceof Error) {
    // Check for common error patterns and categorize them
    if (error.message.includes("database") || error.message.includes("connection")) {
      return {
        message: "Database connection failed",
        type: ErrorType.DATABASE_CONNECTION,
      }
    }

    if (error.message.includes("authentication") || error.message.includes("login")) {
      return {
        message: "Authentication failed",
        type: ErrorType.AUTHENTICATION,
      }
    }

    if (error.message.includes("not found") || error.message.includes("404")) {
      return {
        message: "Resource not found",
        type: ErrorType.NOT_FOUND,
      }
    }

    return {
      message: error.message,
      type: ErrorType.UNKNOWN,
    }
  }

  return {
    message: "An unknown error occurred",
    type: ErrorType.UNKNOWN,
  }
}
