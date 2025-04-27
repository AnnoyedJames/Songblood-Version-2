"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Database, AlertCircle, CheckCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ConnectionStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    // Check connection status on mount
    checkConnection()

    // Set up interval to check connection status every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [])

  async function checkConnection() {
    try {
      const response = await fetch("/api/check-connection")
      const data = await response.json()

      setStatus(data.connected ? "connected" : "disconnected")
      setLastChecked(new Date())
    } catch (error) {
      console.error("Error checking connection:", error)
      setStatus("disconnected")
      setLastChecked(new Date())
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Badge
              variant={status === "connected" ? "outline" : "destructive"}
              className={`px-2 py-1 ${status === "checking" ? "animate-pulse" : ""}`}
            >
              {status === "connected" ? (
                <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 mr-1 text-red-500" />
              )}
              <Database className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">
                {status === "checking" ? "Checking..." : status === "connected" ? "Connected" : "Disconnected"}
              </span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Database connection status</p>
          {lastChecked && (
            <p className="text-xs text-muted-foreground">Last checked: {lastChecked.toLocaleTimeString()}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
