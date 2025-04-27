"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function FallbackModeIndicator() {
  const [isFallbackMode, setIsFallbackMode] = useState(false)

  useEffect(() => {
    try {
      // Check if we're in fallback mode by looking at the cookie
      const cookies = document.cookie.split(";")
      const fallbackModeCookie = cookies.find((cookie) => cookie.trim().startsWith("fallbackMode="))
      setIsFallbackMode(fallbackModeCookie !== undefined)

      // Also check if there was a database connection error
      const connectionErrorCookie = cookies.find((cookie) => cookie.trim().startsWith("connectionError="))
      if (connectionErrorCookie) {
        setIsFallbackMode(true)
      }
    } catch (error) {
      console.error("Error checking fallback mode:", error)
      // If there's an error, assume we're in fallback mode
      setIsFallbackMode(true)
    }
  }, [])

  if (!isFallbackMode) {
    return null
  }

  return (
    <Alert className="rounded-none border-t-0 border-x-0 bg-amber-50 border-amber-200">
      <Info className="h-4 w-4 text-amber-500" />
      <AlertDescription className="text-amber-700">
        <strong>Demo Mode Active:</strong> Running with sample data. Database connection unavailable. Use username:{" "}
        <strong>demo</strong> password: <strong>demo</strong> if you encounter login issues.
      </AlertDescription>
    </Alert>
  )
}
