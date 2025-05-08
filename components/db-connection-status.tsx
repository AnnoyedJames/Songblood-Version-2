"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DbConnectionStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error" | "fallback">("loading")
  const [message, setMessage] = useState<string>("Checking database connection...")
  const [isChecking, setIsChecking] = useState<boolean>(false)

  const checkConnection = async () => {
    if (isChecking) return

    setIsChecking(true)
    setStatus("loading")
    setMessage("Checking database connection...")

    try {
      const response = await fetch("/api/check-connection")
      const data = await response.json()

      if (data.fallbackMode) {
        setStatus("fallback")
        setMessage(data.message || "Using development mode with sample data")
      } else if (data.success) {
        setStatus("connected")
        setMessage(data.message || "Connected to database")
      } else {
        setStatus("error")
        setMessage(data.message || "Failed to connect to database")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Error checking connection status")
      console.error("Connection check error:", error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()

    // Set up periodic connection checks
    const interval = setInterval(checkConnection, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  if (status === "loading") {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Checking Connection</AlertTitle>
        <AlertDescription className="text-blue-700">{message}</AlertDescription>
      </Alert>
    )
  }

  if (status === "fallback") {
    return (
      <Alert className="bg-purple-50 border-purple-200">
        <WifiOff className="h-4 w-4 text-purple-600" />
        <AlertTitle className="text-purple-800">Development Mode</AlertTitle>
        <AlertDescription className="text-purple-700">
          {message}
          <Button
            variant="outline"
            size="sm"
            onClick={checkConnection}
            disabled={isChecking}
            className="ml-2 mt-2 bg-purple-100 hover:bg-purple-200 text-purple-800"
          >
            {isChecking ? "Checking..." : "Check Again"}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (status === "error") {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Connection Error</AlertTitle>
        <AlertDescription className="text-red-700">
          {message}
          <Button
            variant="outline"
            size="sm"
            onClick={checkConnection}
            disabled={isChecking}
            className="ml-2 mt-2 bg-red-100 hover:bg-red-200 text-red-800"
          >
            {isChecking ? "Checking..." : "Retry Connection"}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="bg-green-50 border-green-200">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">Connected</AlertTitle>
      <AlertDescription className="text-green-700">
        {message}
        <Button
          variant="outline"
          size="sm"
          onClick={checkConnection}
          disabled={isChecking}
          className="ml-2 mt-2 bg-green-100 hover:bg-green-200 text-green-800"
        >
          {isChecking ? "Checking..." : "Check Again"}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
