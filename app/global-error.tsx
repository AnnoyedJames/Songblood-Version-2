"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Check if this is a redirect error
  const isRedirectError = error.message.includes("NEXT_REDIRECT") || error.message.includes("Redirect")

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold mb-4">{isRedirectError ? "Session Error" : "Something went wrong"}</h1>
            <p className="text-gray-600 mb-8">
              {isRedirectError
                ? "Your session may have expired or you need to log in."
                : "A critical error has occurred. Please try refreshing the page."}
            </p>
            {isRedirectError ? (
              <Button asChild>
                <Link href="/login">Go to Login</Link>
              </Button>
            ) : (
              <Button onClick={() => reset()}>Try again</Button>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
