"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"

export default function DbConnectionStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch("/api/check-connection")
        const data = await response.json()

        if (data.connected) {
          setStatus("connected")
        } else {
          setStatus("error")
          setErrorMessage(data.error || "Unknown error")
        }
      } catch (error) {
        setStatus("error")
        setErrorMessage("Failed to check connection")
      }
    }

    checkConnection()
  }, [])

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={status === "connected" ? "success" : status === "error" ? "destructive" : "outline"}
        className="flex items-center gap-1"
      >
        {status === "connected" ? (
          <>
            <CheckCircle2 className="h-3 w-3" /> Connected
          </>
        ) : status === "error" ? (
          <>
            <XCircle className="h-3 w-3" /> Error
          </>
        ) : (
          "Checking..."
        )}
      </Badge>
      {status === "error" && errorMessage && <span className="text-xs text-red-500">{errorMessage}</span>}
    </div>
  )
}
