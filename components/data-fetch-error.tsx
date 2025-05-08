"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DataFetchErrorProps {
  message?: string
  details?: string
  onRetry?: () => void
  className?: string
}

export function DataFetchError({
  message = "Failed to load data",
  details,
  onRetry,
  className = "",
}: DataFetchErrorProps) {
  return (
    <div className={`w-full ${className}`}>
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
        {details && <p className="mt-2 text-sm opacity-80">{details}</p>}
      </Alert>

      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  )
}
