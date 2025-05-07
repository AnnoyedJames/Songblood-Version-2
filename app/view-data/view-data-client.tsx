"use client"

import { Suspense } from "react"
import Header from "@/components/header"
import ViewDataTabs from "./view-data-tabs"
import ErrorBoundary from "@/components/error-boundary"
import DatabaseError from "@/components/database-error"
import { AppError, ErrorType } from "@/lib/error-handling"

interface ViewDataClientProps {
  hospitalId: number
  error?: Error | null
}

export default function ViewDataClient({ hospitalId, error }: ViewDataClientProps) {
  // If there's an error, show the error UI
  if (error) {
    // Handle database connection errors
    if (error instanceof AppError && error.type === ErrorType.DATABASE_CONNECTION) {
      return <DatabaseError message="Unable to load data. Database connection failed." />
    }

    // Return a simple error message for other errors
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error.message || "An unexpected error occurred"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Normal UI when there's no error
  return (
    <div className="min-h-screen flex flex-col">
      <Header hospitalId={hospitalId} />

      <main className="flex-1 container py-6 px-4 md:py-8">
        <h1 className="text-2xl font-bold mb-6">View Data</h1>

        <div className="max-w-6xl mx-auto">
          <ErrorBoundary>
            <Suspense fallback={<div className="text-center py-8">Loading data...</div>}>
              <ViewDataTabs hospitalId={hospitalId} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
