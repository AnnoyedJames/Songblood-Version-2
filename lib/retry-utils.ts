/**
 * Utility functions for handling retries and connection issues
 */

import { AppError, ErrorType } from "./error-handling"

/**
 * Configuration for retry operations
 */
export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffFactor: number
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffFactor: 2,
}

/**
 * Executes a function with retry logic
 * @param fn The function to execute
 * @param config Retry configuration
 * @returns The result of the function
 */
export async function withRetry<T>(fn: () => Promise<T>, config: RetryConfig = DEFAULT_RETRY_CONFIG): Promise<T> {
  let lastError: Error | null = null
  let delay = config.initialDelayMs

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if this is not a retryable error
      if (error instanceof AppError && error.retryable === false) {
        throw error
      }

      // Don't retry on the last attempt
      if (attempt === config.maxRetries) {
        throw lastError
      }

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * config.backoffFactor, config.maxDelayMs)

      // Add some jitter to prevent all retries happening at the same time
      const jitter = Math.random() * 0.3 * delay
      const actualDelay = delay + jitter

      console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${Math.round(actualDelay)}ms`)

      // Wait before the next attempt
      await new Promise((resolve) => setTimeout(resolve, actualDelay))
    }
  }

  // This should never happen due to the throw in the loop
  throw new AppError(ErrorType.SERVER, "Maximum retry attempts reached", lastError?.message || "Unknown error", false)
}

/**
 * Checks if an error is likely due to a network or connection issue
 */
export function isConnectionError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.type === ErrorType.DATABASE_CONNECTION
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("offline") ||
      message.includes("failed to fetch") ||
      message.includes("econnrefused") ||
      message.includes("socket")
    )
  }

  return false
}

/**
 * Checks if an error is likely due to a timeout
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.type === ErrorType.TIMEOUT
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes("timeout") || message.includes("timed out")
  }

  return false
}
