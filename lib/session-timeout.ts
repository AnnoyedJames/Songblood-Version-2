"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "@/components/session-provider"

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000

export function useSessionTimeout() {
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [showWarning, setShowWarning] = useState<boolean>(false)
  const [remainingTime, setRemainingTime] = useState<number>(SESSION_TIMEOUT)
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState<boolean>(false)
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, setIsAuthenticated } = useSession()

  // Reset the timer when there's user activity
  const resetTimer = () => {
    if (!keepMeLoggedIn) {
      setLastActivity(Date.now())
      setShowWarning(false)
    }
  }

  // Handle user activity events
  useEffect(() => {
    if (!isAuthenticated) return

    const events = ["mousedown", "keypress", "scroll", "touchstart", "mousemove"]

    const handleActivity = () => {
      resetTimer()
    }

    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [isAuthenticated, keepMeLoggedIn])

  // Check for session timeout
  useEffect(() => {
    if (!isAuthenticated || keepMeLoggedIn) return

    const warningTime = 5 * 60 * 1000 // 5 minutes before timeout
    const interval = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity
      const timeRemaining = SESSION_TIMEOUT - timeSinceLastActivity

      setRemainingTime(Math.max(0, timeRemaining))

      // Show warning 5 minutes before timeout
      if (timeRemaining <= warningTime && timeRemaining > 0 && !showWarning) {
        setShowWarning(true)
        toast({
          title: "Session expiring soon",
          description: "Your session will expire soon due to inactivity. Please continue working to stay logged in.",
          duration: 10000,
        })
      }

      // Logout if session has timed out
      if (timeRemaining <= 0) {
        clearInterval(interval)
        handleTimeout()
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [isAuthenticated, lastActivity, showWarning, keepMeLoggedIn])

  // Handle session timeout
  const handleTimeout = () => {
    setIsAuthenticated(false)
    toast({
      title: "Session expired",
      description: "Your session has expired due to inactivity. Please log in again.",
      variant: "destructive",
    })
    router.push("/login?reason=session-timeout")
  }

  // Format remaining time for display
  const formatRemainingTime = () => {
    const minutes = Math.floor(remainingTime / 60000)
    const seconds = Math.floor((remainingTime % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return {
    showWarning,
    remainingTime: formatRemainingTime(),
    resetTimer,
    keepMeLoggedIn,
    setKeepMeLoggedIn,
  }
}

export function SessionTimeoutWarning() {
  const { showWarning, remainingTime, keepMeLoggedIn, setKeepMeLoggedIn } = useSessionTimeout()

  if (!showWarning) return null

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg z-50">
      <div className="flex items-center">
        <div className="py-1">
          <p className="font-bold">Session Expiring</p>
          <p className="text-sm">
            Your session will expire in {remainingTime}. Continue using the application to stay logged in.
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center">
        <input
          type="checkbox"
          id="keep-logged-in"
          checked={keepMeLoggedIn}
          onChange={(e) => setKeepMeLoggedIn(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="keep-logged-in" className="text-sm">
          Keep me logged in
        </label>
      </div>
    </div>
  )
}
