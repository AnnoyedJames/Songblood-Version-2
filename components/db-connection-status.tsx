"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"

export default function DatabaseConnectionStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [message, setMessage] = useState<string>("")
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/db-status", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
      const data = await response.json()

      if (data.connected) {
        setStatus("connected")
        setMessage("Database connected")
      } else {
        setStatus("error")
        setMessage(data.error || "Unable to connect to database")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Error checking database connection")
      console.error("Error checking database connection:", error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
    // Set up interval to check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm">
      {status === "loading" ? (
        <div className="flex items-center gap-1 text-yellow-600">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Checking database connection...</span>
        </div>
      ) : status === "connected" ? (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Database connected</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>Database error: {message}</span>
          <button
            onClick={checkConnection}
            disabled={isChecking}
            className="ml-2 rounded-md bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
            aria-label="Retry database connection"
          >
            {isChecking ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Retry"}
          </button>
        </div>
      )}
    </div>
  )
}
