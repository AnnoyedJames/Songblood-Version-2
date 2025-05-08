"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { isRedirectError, getRedirectUrl } from "@/lib/navigation"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [redirecting, setRedirecting] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  useEffect(() => {
    // Log the error
    console.error("Global error:", error)

    // Handle redirect errors
    if (isRedirectError(error)) {
      const url = getRedirectUrl(error) || "/login?reason=error-redirect"
      console.log("Handling redirect in global error boundary:", url)
      setRedirectUrl(url)
      setRedirecting(true)

      // Use a timeout to allow the UI to update before redirecting
      const timer = setTimeout(() => {
        window.location.href = url
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [error])

  // Check if this is a database error
  const isDatabaseError =
    error.message.includes("database") ||
    error.message.includes("connection") ||
    error.message.includes("Failed to fetch")

  if (redirecting) {
    return (
      <html lang="en">
        <body>
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="text-center max-w-md">
              <h1 className="text-xl font-bold mb-4">Redirecting...</h1>
              <p className="mb-4">Please wait while we redirect you to {redirectUrl || "the login page"}.</p>
              <div className="flex justify-center">
                <ArrowRight className="animate-pulse h-6 w-6" />
              </div>
            </div>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {isDatabaseError
                ? "Database Connection Error"
                : isRedirectError(error)
                  ? "Navigation Error"
                  : "Something went wrong"}
            </h1>
            <p className="text-gray-600 mb-8">
              {isDatabaseError
                ? "We're unable to connect to the database at this time. Please try again later."
                : isRedirectError(error)
                  ? "There was a problem navigating to the requested page."
                  : "A critical error has occurred. Please try refreshing the page."}
            </p>
            <Button onClick={() => reset()}>Try again</Button>
            <Button asChild className="ml-4">
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
