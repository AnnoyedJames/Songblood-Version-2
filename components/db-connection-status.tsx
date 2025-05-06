"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function DbConnectionStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkConnection = async () => {
    if (isChecking) return

    setIsChecking(true)
    setStatus("loading")

    try {
      const response = await fetch("/api/check-connection", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })

      const data = await response.json()

      if (data.connected) {
        setStatus("connected")
        setErrorMessage("")
      } else {
        setStatus("error")
        setErrorMessage(data.error || "Unknown error")
      }
    } catch (error) {
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to check connection")
    } finally {
      setIsChecking(false)
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    checkConnection()

    // Set up periodic connection checks
    const interval = setInterval(checkConnection, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge
              variant={status === "connected" ? "success" : status === "error" ? "destructive" : "outline"}
              className="flex items-center gap-1 cursor-pointer"
              onClick={checkConnection}
            >
              {status === "loading" ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" /> Checking...
                </>
              ) : status === "connected" ? (
                <>
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" /> Error
                </>
              )}
            </Badge>
            {lastChecked && (
              <span className="text-xs text-muted-foreground hidden md:inline">
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {status === "connected" ? (
            <p>Database connection is active</p>
          ) : status === "error" ? (
            <div>
              <p className="font-semibold">Connection Error</p>
              <p className="text-sm">{errorMessage}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={checkConnection}
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3" /> Retry Connection
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p>Checking database connection...</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
