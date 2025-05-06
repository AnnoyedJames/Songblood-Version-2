"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000

// Warning before timeout (5 minutes before)
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000

export default function SessionMonitor() {
  const router = useRouter()
  const { toast } = useToast()
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [warningShown, setWarningShown] = useState<boolean>(false)

  // Function to reset the session timer
  const resetTimer = useCallback(() => {
    setLastActivity(Date.now())
    setWarningShown(false)
  }, [])

  // Function to handle user activity
  const handleActivity = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  // Function to handle logout
  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      // Show logout toast
      toast({
        title: "Logged Out",
        description: "You have been logged out due to inactivity.",
      })

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }, [router, toast])

  // Check for session timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const timeElapsed = now - lastActivity

      // If warning time has elapsed but not timeout yet, show warning
      if (timeElapsed >= SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT && timeElapsed < SESSION_TIMEOUT && !warningShown) {
        // Show warning toast
        toast({
          title: "Session Expiring Soon",
          description: "Your session will expire soon due to inactivity. Please continue working to stay logged in.",
          duration: 10000,
        })
        setWarningShown(true)
      }

      // If timeout has elapsed, log out
      if (timeElapsed >= SESSION_TIMEOUT) {
        handleLogout()
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [lastActivity, handleLogout, toast, warningShown])

  // Add event listeners for user activity
  useEffect(() => {
    // List of events to track
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [handleActivity])

  return null
}
