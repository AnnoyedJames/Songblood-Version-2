"use client"

import type React from "react"

import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ServerCrash, RefreshCw } from "lucide-react"
import Link from "next/link"

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  // Determine if this is a database error
  const isDatabaseError =
    error.message?.includes("database") ||
    error.message?.includes("connection") ||
    error.message?.includes("Failed to fetch")

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

        <Alert className={isDatabaseError ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}>
          <AlertTitle>{isDatabaseError ? "Database Connection Error" : "Error"}</AlertTitle>
          <AlertDescription>
            {isDatabaseError
              ? "Unable to connect to the database. Please try again later."
              : error.message || "An unexpected error occurred. Please try again."}
          </AlertDescription>
        </Alert>

        <div className="flex justify-center gap-4 mt-6">
          <Button onClick={resetErrorBoundary} className="gap-2">
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

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app here
        console.log("Error boundary reset")
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}
