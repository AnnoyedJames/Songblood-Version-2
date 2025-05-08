"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function FallbackModeIndicator() {
  const [isFallbackMode, setIsFallbackMode] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    try {
      // Check if we're in fallback mode by looking at the cookie
      const cookies = document.cookie.split(";")
      const fallbackModeCookie = cookies.find((cookie) => cookie.trim().startsWith("fallbackMode="))
      setIsFallbackMode(fallbackModeCookie !== undefined)

      // Also check if there was a database connection error
      const connectionErrorCookie = cookies.find((cookie) => cookie.trim().startsWith("connectionError="))
      if (connectionErrorCookie) {
        setConnectionError(true)
        // Try to extract the error message if available
        const errorMsgCookie = cookies.find((cookie) => cookie.trim().startsWith("errorMessage="))
        if (errorMsgCookie) {
          try {
            const errorMsg = decodeURIComponent(errorMsgCookie.split("=")[1])
            setErrorMessage(errorMsg)
          } catch (e) {
            // If decoding fails, use a generic message
            setErrorMessage("Unable to connect to the database")
          }
        }
      }
    } catch (error) {
      console.error("Error checking fallback mode:", error)
      // If there's an error, assume we're in fallback mode
      setIsFallbackMode(true)
    }
  }, [])

  if (!isFallbackMode && !connectionError) {
    return null
  }

  return (
    <Alert className="rounded-none border-t-0 border-x-0 bg-amber-50 border-amber-200">
      {connectionError ? (
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      ) : (
        <Info className="h-4 w-4 text-amber-500" />
      )}
      <div>
        <AlertTitle className="text-amber-800">
          {connectionError ? "Database Connection Error" : "Demo Mode Active"}
        </AlertTitle>
        <AlertDescription className="text-amber-700">
          {connectionError
            ? errorMessage ||
              "The system couldn't connect to the database. Running with sample data. Some features may be limited."
            : "Running in demo mode with sample data. Database connection unavailable."}{" "}
          <Link href="/login" className="font-medium underline">
            Use username: demo, password: demo
          </Link>{" "}
          if you encounter login issues.
        </AlertDescription>
      </div>
    </Alert>
  )
}
