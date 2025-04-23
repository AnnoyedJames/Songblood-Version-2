"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ServerCrash, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  // Check if this is a redirect error
  const isRedirectError = error.message.includes("NEXT_REDIRECT") || error.message.includes("Redirect")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ServerCrash className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">{isRedirectError ? "Session Error" : "Something went wrong"}</h1>
          <p className="mt-2 text-gray-600">
            {isRedirectError
              ? "Your session may have expired or you need to log in."
              : "We apologize for the inconvenience"}
          </p>
        </div>

        <Alert variant="destructive" className="mb-6">
          <AlertTitle>{isRedirectError ? "Session Error" : "Error"}</AlertTitle>
          <AlertDescription>
            {isRedirectError
              ? "Please log in to continue."
              : error.message || "An unexpected error occurred. Please try again."}
          </AlertDescription>
        </Alert>

        <div className="flex justify-center gap-4">
          {isRedirectError ? (
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          ) : (
            <Button onClick={() => reset()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          )}
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
