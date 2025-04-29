"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ServerCrash, RefreshCw, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ErrorType } from "@/lib/error-handling"
import { useRouter } from "next/navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; type?: ErrorType }
  reset: () => void
}) {
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)

    // Check if this is a redirect error by looking at the error message
    if (error.message?.includes("NEXT_REDIRECT")) {
      // Extract the URL from the error message if possible
      const urlMatch = error.message.match(/url=([^,]+)/)
      const url = urlMatch ? urlMatch[1] : "/login?reason=error-redirect"

      console.log("Handling redirect in error boundary:", url)
      setRedirectUrl(url)
      setRedirecting(true)

      // Use a timeout to allow the UI to update before redirecting
      const timer = setTimeout(() => {
        window.location.href = url // Use window.location for hard navigation
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [error, router])

  // Check if this is a database connection error
  const isDatabaseError =
    error.type === ErrorType.DATABASE_CONNECTION ||
    error.message?.includes("database") ||
    error.message?.includes("connection") ||
    error.message?.includes("Failed to fetch")

  // Check if this is a navigation error
  const isNavigationError =
    error.type === ErrorType.NAVIGATION || error.message?.includes("navigation") || error.message?.includes("route")

  if (redirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-bold mb-4">Redirecting...</h1>
          <p className="mb-4">Please wait while we redirect you to {redirectUrl || "the login page"}.</p>
          <div className="flex justify-center">
            <ArrowRight className="animate-pulse h-6 w-6" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ServerCrash className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-gray-600">We apologize for the inconvenience</p>
        </div>

        <Alert variant={isDatabaseError ? "warning" : isNavigationError ? "default" : "destructive"} className="mb-6">
          <AlertTitle>
            {isDatabaseError ? "Database Connection Error" : isNavigationError ? "Navigation Error" : "Error"}
          </AlertTitle>
          <AlertDescription>
            {isDatabaseError
              ? "Unable to connect to the database. Please try again later."
              : isNavigationError
                ? "There was a problem navigating to the requested page."
                : error.message || "An unexpected error occurred. Please try again."}
          </AlertDescription>
        </Alert>

        <div className="flex justify-center gap-4">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
