"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type DatabaseErrorProps = {
  message?: string
  showLoginLink?: boolean
}

export default function DatabaseError({
  message = "Unable to connect to the database. Please try again later.",
  showLoginLink = true,
}: DatabaseErrorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Database Connection Error</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        {showLoginLink && (
          <Button asChild className="w-full">
            <Link href="/login">Return to Login</Link>
          </Button>
        )}
        {!showLoginLink && (
          <Button onClick={() => window.location.reload()} className="w-full">
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}
