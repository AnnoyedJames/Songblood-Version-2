"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type SessionTimeoutOptions = {
  timeoutMinutes?: number
  warningMinutes?: number
  onTimeout?: () => void
  onWarning?: () => void
  enabled?: boolean
}

export function useSessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onTimeout,
  onWarning,
  enabled = true,
}: SessionTimeoutOptions = {}) {
  const router = useRouter()
  const { toast } = useToast()
  const [warningShown, setWarningShown] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())

  // Convert minutes to milliseconds
  const timeoutMs = timeoutMinutes * 60 * 1000
  const warningMs = warningMinutes * 60 * 1000

  // Reset the timer when there's user activity
  const resetTimer = () => {
    setLastActivity(Date.now())
    setWarningShown(false)
  }

  useEffect(() => {
    if (!enabled) return

    // Set up event listeners for user activity
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "keydown"]

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer)
    })

    // Check for inactivity
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastActivity

      // Show warning before timeout
      if (elapsed > timeoutMs - warningMs && !warningShown) {
        setWarningShown(true)

        toast({
          title: "Session expiring soon",
          description: `Your session will expire in ${warningMinutes} minutes due to inactivity.`,
          variant: "warning",
          duration: 10000,
        })

        if (onWarning) onWarning()
      }

      // Timeout - log the user out
      if (elapsed > timeoutMs) {
        if (onTimeout) onTimeout()

        toast({
          title: "Session expired",
          description: "You have been logged out due to inactivity.",
          variant: "default",
          duration: 5000,
        })

        // Perform logout
        fetch("/api/logout", {
          method: "POST",
          credentials: "include",
        }).finally(() => {
          router.push("/login?reason=session-timeout")

          // Force a hard navigation to ensure all state is cleared
          setTimeout(() => {
            window.location.href = "/login?reason=session-timeout"
          }, 100)
        })
      }
    }, 10000) // Check every 10 seconds

    // Clean up
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer)
      })
      clearInterval(interval)
    }
  }, [lastActivity, timeoutMs, warningMs, warningShown, router, toast, onTimeout, onWarning, enabled])

  return {
    resetTimer,
    timeRemaining: Math.max(0, timeoutMs - (Date.now() - lastActivity)),
    isWarning: warningShown,
  }
}
