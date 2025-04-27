import { redirect } from "next/navigation"
import { AppError, ErrorType } from "./error-handling"

/**
 * Enum for common redirect reasons
 */
export enum RedirectReason {
  SESSION_EXPIRED = "session-expired",
  UNAUTHORIZED = "unauthorized",
  NOT_FOUND = "not-found",
  LOGIN_REQUIRED = "login-required",
  LOGIN_SUCCESS = "login-success",
  LOGOUT_SUCCESS = "logout-success",
}

/**
 * Safe redirect function that handles errors gracefully
 * @param path - The path to redirect to
 * @param reason - Optional reason for the redirect
 */
export function safeRedirect(path: string, reason?: RedirectReason | string): never {
  try {
    // Construct URL with reason if provided
    const url = reason ? `${path}?reason=${reason}` : path

    // Log the redirect for debugging
    console.log(`Redirecting to: ${url}`)

    // Perform the redirect
    redirect(url)
  } catch (error) {
    // If there's an error during redirect, throw a custom error
    throw new AppError(
      ErrorType.NAVIGATION,
      "Navigation failed",
      `Failed to redirect to ${path}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Check if an error is a Next.js redirect error
 * @param error - The error to check
 */
export function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("NEXT_REDIRECT") ||
      error.message.includes("Redirect") ||
      error.message.includes("redirect"))
  )
}

/**
 * Extract the redirect URL from a Next.js redirect error
 * @param error - The redirect error
 */
export function getRedirectUrl(error: Error): string | null {
  try {
    // Extract URL from error message
    // Format is typically: "NEXT_REDIRECT;https://example.com"
    if (error.message.includes("NEXT_REDIRECT")) {
      const parts = error.message.split(";")
      if (parts.length > 1) {
        return parts[1]
      }
    }
    return null
  } catch (e) {
    console.error("Failed to extract redirect URL:", e)
    return null
  }
}
