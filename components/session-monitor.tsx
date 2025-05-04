"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function SessionMonitor() {
  const router = useRouter()
  const { toast } = useToast()
  const [isCheckingSession, setIsCheckingSession] = useState(false)

  // Function to check session validity
  const checkSession = async () => {
    if (isCheckingSession) return

    setIsCheckingSession(true)

    try {
      const response = await fetch("/api/check-session", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        handleSessionExpired()
        return
      }

      const data = await response.json()

      if (!data.authenticated) {
        handleSessionExpired()
      }
    } catch (error) {
      console.error("Error checking session:", error)
    } finally {
      setIsCheckingSession(false)
    }
  }

  // Handle session expiration
  const handleSessionExpired = () => {
    // Save current URL for redirect after login
    const currentPath = encodeURIComponent(window.location.pathname + window.location.search)

    toast({
      title: "Session expired",
      description: "Your session has expired. Please log in again.",
      variant: "destructive",
    })

    // Redirect to login
    router.push(`/login?reason=session-expired&returnTo=${currentPath}`)
  }

  useEffect(() => {
    // Skip on login and register pages
    if (window.location.pathname === "/login" || window.location.pathname === "/register") {
      return
    }

    // Check session on page load
    checkSession()

    // Set up interval to check session periodically
    const interval = setInterval(checkSession, 5 * 60 * 1000) // Every 5 minutes

    // Set up event listeners for form submissions
    const handleBeforeSubmit = () => {
      checkSession()
    }

    document.addEventListener("submit", handleBeforeSubmit)

    return () => {
      clearInterval(interval)
      document.removeEventListener("submit", handleBeforeSubmit)
    }
  }, [])

  // This component doesn't render anything visible
  return null
}
