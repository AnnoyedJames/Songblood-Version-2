"use client"

import { AlertTriangle } from "lucide-react"
import Link from "next/link"

interface DatabaseErrorProps {
  message?: string
  details?: string
  showLoginLink?: boolean
}

export default function DatabaseError({
  message = "Unable to connect to the database",
  details,
  showLoginLink = true,
}: DatabaseErrorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <h1 className="mb-2 text-center text-xl font-bold text-red-600">Database Connection Error</h1>
        <p className="mb-4 text-center text-gray-700">{message}</p>

        {details && (
          <div className="mb-4 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-medium">Technical details:</p>
            <p className="mt-1">{details}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-md bg-red-600 py-2 text-white transition-colors hover:bg-red-700"
          >
            Retry Connection
          </button>

          {showLoginLink && (
            <Link
              href="/login"
              className="w-full rounded-md border border-gray-300 bg-white py-2 text-center text-gray-700 transition-colors hover:bg-gray-50"
            >
              Return to Login
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>If this problem persists, please contact your system administrator.</p>
      </div>
    </div>
  )
}
