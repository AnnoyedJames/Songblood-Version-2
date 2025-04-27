"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DbConnectionStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function checkConnection() {
      try {
        // Add a cache-busting parameter to prevent caching
        const response = await fetch(`/api/check-connection?t=${Date.now()}`, {
          // Add these options to prevent caching
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        // Check if component is still mounted before updating state
        if (!isMounted) return

        if (!response.ok) {
          setStatus("error")
          setErrorMessage("Failed to check database connection")
          return
        }

        const data = await response.json()

        if (data.connected) {
          setStatus("connected")
        } else {
          setStatus("error")
          setErrorMessage(data.error || "Unable to connect to the database")
        }
      } catch (error) {
        // Check if component is still mounted before updating state
        if (!isMounted) return

        console.error("Error checking database connection:", error)
        setStatus("error")
        setErrorMessage("Failed to check database connection")
      }
    }

    // Check connection status
    checkConnection()

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false
    }
  }, [retryCount])

  // Function to retry the connection check
  const handleRetry = () => {
    setStatus("loading")
    setRetryCount((prev) => prev + 1)
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking database connection...
      </div>
    )
  }

  if (status === "error") {
    return (
      <Alert variant="warning" className="mb-4">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Database Connection Issue</AlertTitle>
        <AlertDescription className="flex flex-col">
          <span>{errorMessage}</span>
          <span className="mt-1">Please contact your administrator if this issue persists.</span>
          <Button variant="outline" size="sm" className="mt-2 w-full sm:w-auto" onClick={handleRetry}>
            Retry connection check
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
