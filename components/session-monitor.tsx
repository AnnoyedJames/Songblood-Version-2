"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import {
  SESSION_TIMEOUT,
  WARNING_BEFORE_TIMEOUT,
  showSessionTimeoutWarning,
  showSessionExpiredNotification,
  showSessionTimeoutConfirmation,
} from "@/lib/session-timeout"

export default function SessionMonitor() {
  const router = useRouter()
  const { toast } = useToast()
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [warningToastId, setWarningToastId] = useState<string | null>(null)

  // Function to reset the session timer
  const resetTimer = useCallback(() => {
    setLastActivity(Date.now())
    // Dismiss any existing warning toast
    if (warningToastId) {
      toast.dismiss(warningToastId)
      setWarningToastId(null)
    }
  }, [toast, warningToastId])

  // Function to handle user activity
  const handleActivity = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  // Function to extend the session
  const extendSession = useCallback(async () => {
    try {
      const response = await fetch("/api/check-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        // Session is invalid, redirect to login
        router.push("/login")
        return
      }

      // Session is valid, reset the timer
      resetTimer()

      // Dismiss any existing warning toast
      if (warningToastId) {
        toast.dismiss(warningToastId)
        setWarningToastId(null)
      }

      // Show confirmation toast
      toast({
        title: "Session Extended",
        description: "Your session has been extended.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error extending session:", error)
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to extend session. Please try again.",
        variant: "destructive",
      })
    }
  }, [resetTimer, router, toast, warningToastId])

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
      if (
        timeElapsed >= SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT &&
        timeElapsed < SESSION_TIMEOUT &&
        !warningToastId &&
        !isDialogOpen
      ) {
        // Show warning toast
        const id = showSessionTimeoutWarning(extendSession)
        setWarningToastId(id)
        setIsDialogOpen(true)
      }

      // If timeout has elapsed, log out
      if (timeElapsed >= SESSION_TIMEOUT) {
        // Dismiss any existing warning toast
        if (warningToastId) {
          toast.dismiss(warningToastId)
          setWarningToastId(null)
        }

        // Show session expired notification
        showSessionExpiredNotification(() => router.push("/login"))

        // Log out
        handleLogout()
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [lastActivity, extendSession, handleLogout, router, toast, warningToastId, isDialogOpen])

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

  return <>{showSessionTimeoutConfirmation(extendSession, handleLogout, isDialogOpen, setIsDialogOpen)}</>
}
