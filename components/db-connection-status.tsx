"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react"

export default function DbConnectionStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error" | "preview">("loading")
  const [message, setMessage] = useState<string>("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/db-status", {
          // Add cache: 'no-store' to prevent caching
          cache: "no-store",
          // Add a timestamp to prevent caching
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            "X-Timestamp": Date.now().toString(),
          },
        })

        // Check if the response is ok
        if (!response.ok) {
          console.error("DB status API returned error:", response.status, response.statusText)
          setStatus("error")
          setMessage(`API error: ${response.status} ${response.statusText}`)
          return
        }

        const data = await response.json()
        console.log("DB status response:", data)

        // Check if we're in preview mode
        if (data.isPreview) {
          setStatus("preview")
          setMessage(data.message || "Preview mode: Using mock data")
          return
        }

        if (data.connected) {
          setStatus("connected")
          setMessage(data.message || "Database connected successfully")
        } else {
          setStatus("error")
          setMessage(data.message || "Unable to connect to database")
          console.warn("Database connection failed:", data.message)
        }
      } catch (error) {
        console.error("Error checking DB status:", error)
        setStatus("error")
        setMessage(error instanceof Error ? `Error: ${error.message}` : "Error checking database connection")
      }
    }

    checkConnection()
  }, [retryCount])

  useEffect(() => {
    if (status === "connected") {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setShowSuccess(false)
    }
  }, [status])

  const handleRetry = () => {
    setStatus("loading")
    setRetryCount((prev) => prev + 1)
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-3 bg-gray-100 rounded-md mb-4">
        <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-500" />
        <span className="text-sm text-gray-600">Checking database connection...</span>
      </div>
    )
  }

  if (status === "preview") {
    return (
      <div className="flex items-center p-3 bg-amber-50 text-amber-700 rounded-md mb-4 border border-amber-200">
        <Info className="h-4 w-4 mr-2 flex-shrink-0" />
        <div className="text-sm flex-grow">{message}</div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex items-center p-3 bg-red-50 text-red-700 rounded-md mb-4 border border-red-200">
        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
        <div className="text-sm flex-grow">{message}</div>
        <button
          onClick={handleRetry}
          className="ml-2 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
        >
          Retry
        </button>
      </div>
    )
  }

  if (status === "connected" && showSuccess) {
    return (
      <div className="flex items-center p-3 bg-green-50 text-green-700 rounded-md mb-4 border border-green-200">
        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
        <div className="text-sm">{message}</div>
      </div>
    )
  }

  return null
}
