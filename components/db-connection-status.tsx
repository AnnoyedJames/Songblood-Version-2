"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function DbConnectionStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [message, setMessage] = useState<string>("")
  const [showSuccess, setShowSuccess] = useState(false); // Initialize to false

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/db-status")
        const data = await response.json()

        if (data.connected) {
          setStatus("connected")
          setMessage(data.message || "Database connected successfully")
        } else {
          setStatus("error")
          setMessage(data.message || "Unable to connect to database")
        }
      } catch (error) {
        setStatus("error")
        setMessage("Error checking database connection")
        console.error("Error checking DB status:", error)
      }
    }

    checkConnection()
  }, [])

  useEffect(() => {
    if (status === "connected") {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowSuccess(false); // Reset showSuccess when status is not "connected"
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-3 bg-gray-100 rounded-md mb-4">
        <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-500" />
        <span className="text-sm text-gray-600">Checking database connection...</span>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex items-center p-3 bg-red-50 text-red-700 rounded-md mb-4 border border-red-200">
        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
        <div className="text-sm">{message}</div>
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
