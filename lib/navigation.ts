import { redirect } from "next/navigation"
import { AppError, ErrorType } from "./error-handling"

// Function to check if an error is a redirect error
export function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message?.includes("NEXT_REDIRECT") || error.message?.includes("redirect") || error.name === "RedirectError")
  )
}

// Function to extract the redirect URL from an error
export function getRedirectUrl(error: unknown): string | null {
  if (!isRedirectError(error)) return null

  // Try to extract the URL from the error message
  const errorMessage = (error as Error).message || ""
  const urlMatch = errorMessage.match(/url=([^,]+)/)

  return urlMatch ? urlMatch[1] : null
}

// Safe redirect function that won't throw in an error boundary
export function safeRedirect(url: string, type: "replace" | "push" = "replace") {
  try {
    redirect(url)
  } catch (error) {
    console.error("Redirect error:", error)
    // Fallback to client-side navigation
    if (typeof window !== "undefined") {
      window.location.href = url
    }
  }
}

// Function to create a redirect error
export function createRedirectError(url: string): AppError {
  return new AppError(ErrorType.NAVIGATION, `Redirect to ${url}`, { redirectUrl: url })
}
