"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle, Info } from "lucide-react"

type RedirectReason =
  | "session-expired"
  | "unauthorized"
  | "not-found"
  | "login-required"
  | "login-success"
  | "logout-success"
  | "error"
  | "error-redirect"
  | string

type RedirectHandlerProps = {
  reason?: RedirectReason
}

export default function RedirectHandler({ reason }: RedirectHandlerProps) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (reason) {
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setDismissed(true)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [reason])

  if (!reason || dismissed) {
    return null
  }

  // Define alert variants and messages based on reason
  let variant: "default" | "destructive" | "success" = "default"
  let icon = <Info className="h-4 w-4" />
  let title = "Notice"
  let message = ""

  switch (reason) {
    case "session-expired":
      variant = "default"
      icon = <Info className="h-4 w-4" />
      title = "Session Expired"
      message = "Your session has expired. Please log in again."
      break
    case "unauthorized":
      variant = "destructive"
      icon = <AlertTriangle className="h-4 w-4" />
      title = "Unauthorized"
      message = "You don't have permission to access that page."
      break
    case "login-required":
      variant = "default"
      icon = <Info className="h-4 w-4" />
      title = "Login Required"
      message = "Please log in to access that page."
      break
    case "logout-success":
      variant = "success"
      icon = <CheckCircle2 className="h-4 w-4" />
      title = "Logged Out"
      message = "You have been successfully logged out."
      break
    case "error-redirect":
      variant = "destructive"
      icon = <AlertTriangle className="h-4 w-4" />
      title = "Navigation Error"
      message = "There was a problem navigating to the requested page."
      break
    default:
      return null
  }

  return (
    <Alert
      variant={variant === "success" ? "default" : variant}
      className={`mb-4 ${variant === "success" ? "border-green-500 text-green-700 bg-green-50" : ""}`}
    >
      {icon}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
