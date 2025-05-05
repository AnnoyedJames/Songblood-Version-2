// Add a custom error boundary for the login page to prevent the global error boundary from being used
// This ensures that any errors in the login page don't trigger the global error boundary

"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import LoginForm from "./login-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ErrorBoundary } from "react-error-boundary"

function LoginErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message || "An error occurred while loading the login page. Please try again."}
          </AlertDescription>
        </Alert>
        <button onClick={resetErrorBoundary} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Try Again
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const returnTo = searchParams?.get("returnTo") || ""
  const reason = searchParams?.get("reason") || ""
  const [showAlert, setShowAlert] = useState(!!reason)

  let alertMessage = ""
  if (reason === "session-timeout") {
    alertMessage = "Your session has timed out. Please log in again."
  } else if (reason === "unauthorized") {
    alertMessage = "Please log in to access that page."
  } else if (reason === "logout") {
    alertMessage = "You have been logged out successfully."
  } else if (reason === "logout-global") {
    alertMessage = "You have been logged out from another tab."
  } else if (reason === "error-redirect") {
    alertMessage = "An error occurred. Please log in again."
  }

  return (
    <ErrorBoundary FallbackComponent={LoginErrorFallback} onReset={() => window.location.reload()}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Songblood</h1>
            <p className="text-gray-600">Blood Inventory Management System</p>
          </div>

          {showAlert && alertMessage && (
            <Alert variant="info" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          )}

          <LoginForm returnTo={returnTo} />
        </div>
      </div>
    </ErrorBoundary>
  )
}
