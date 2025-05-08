/**
 * Utility functions for handling retries and connection issues
 */

import { AppError, ErrorType } from "./error-handling"
import { isRetryableError } from "./error-handling"
import { DB_CONFIG } from "./db-config"

// Default retry options
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: DB_CONFIG.RETRY_COUNT,
  initialDelay: DB_CONFIG.RETRY_DELAY_MS, // 2 seconds
  maxDelay: 30000, // 30 seconds
  factor: 2, // Exponential backoff factor
  jitter: true, // Add randomness to the delay
}

// Type for retry options
export type RetryOptions = typeof DEFAULT_RETRY_OPTIONS

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
  maxRetries: DB_CONFIG.RETRY_COUNT,
  initialDelayMs: DB_CONFIG.RETRY_DELAY_MS,
  maxDelayMs: 30000,
  backoffFactor: 2,
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise with the result of the function
 */
export async function retry<T>(fn: () => Promise<T>, options: Partial<RetryOptions> = {}): Promise<T> {
  // Merge options with defaults
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }

  let lastError: unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Try to execute the function
      return await fn()
    } catch (error) {
      // Save the error
      lastError = error

      // If this is the last attempt or the error is not retryable, throw
      if (attempt === opts.maxRetries || !isRetryableError(error)) {
        throw error
      }

      // Calculate delay with exponential backoff
      let delay = opts.initialDelay * Math.pow(opts.factor, attempt)

      // Apply maximum delay
      delay = Math.min(delay, opts.maxDelay)

      // Add jitter if enabled (±20%)
      if (opts.jitter) {
        const jitterFactor = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
        delay = Math.floor(delay * jitterFactor)
      }

      // Log retry attempt
      console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms`)

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // This should never happen, but TypeScript requires a return
  throw lastError
}

/**
 * Wrap a function with retry capability
 * @param fn Function to wrap
 * @param options Retry options
 * @returns Wrapped function with retry capability
 */
export function withRetry<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options: Partial<RetryOptions> = {},
): (...args: Args) => Promise<T> {
  return (...args: Args) => {
    return retry(() => fn(...args), options)
  }
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
