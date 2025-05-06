/**
 * Utility functions for handling retries and connection issues
 */

import { AppError, ErrorType } from "./error-handling"
import { isUsingFallbackMode } from "./db-config"

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

/**
 * Utility for retrying operations with exponential backoff
 */

// Options for retry with backoff
export interface RetryOptions {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffFactor: number
  onRetry?: (attempt: number, error: Error) => void
}

// Default retry options
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    factor?: number
    onRetry?: (attempt: number, error: Error) => void
  } = {},
): Promise<T> {
  // Skip retries if we're in fallback mode
  if (isUsingFallbackMode()) {
    try {
      return await fn()
    } catch (error) {
      console.warn("Operation failed in fallback mode:", error)
      throw error
    }
  }

  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, factor = 2, onRetry = () => {} } = options

  let attempt = 0
  let delay = initialDelay

  while (true) {
    try {
      return await fn()
    } catch (error: any) {
      attempt++

      if (attempt >= maxRetries) {
        console.error(`Failed after ${attempt} attempts:`, error)
        throw error
      }

      // Log the retry attempt
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error)

      // Call the onRetry callback
      onRetry(attempt, error)

      // Wait for the delay
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Increase the delay for the next attempt, but don't exceed maxDelay
      delay = Math.min(delay * factor, maxDelay)
    }
  }
}

/**
 * Retries a function with a simple delay (no exponential backoff)
 * @param fn The function to retry
 * @param maxRetries Maximum number of retries
 * @param delayMs Delay between retries in milliseconds
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function retryWithDelay<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
  let lastError: Error | null = null
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      attempt++

      // If we've reached the max retries, throw the last error
      if (attempt > maxRetries) {
        break
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error("All retries failed")
}
