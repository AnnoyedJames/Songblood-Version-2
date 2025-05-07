"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Determine if this is a database error
  const isDatabaseError =
    error.message?.includes("database") ||
    error.message?.includes("connection") ||
    error.message?.includes("Failed to fetch")

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {isDatabaseError ? "Database Connection Error" : "Something went wrong"}
            </h1>
            <p className="text-gray-600 mb-8">
              {isDatabaseError
                ? "We're unable to connect to the database at this time. Please try again later."
                : "A critical error has occurred. Please try refreshing the page."}
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => reset()}>Try again</Button>
              <Button variant="outline" asChild>
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
