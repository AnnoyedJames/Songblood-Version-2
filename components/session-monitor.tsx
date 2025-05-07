"use client"

import { useEffect, useRef } from "react"
import { useSession } from "./session-provider"

// Timeout duration in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000

interface LogoutEventDetail {
  message: string
  error: boolean
}

export default function SessionMonitor() {
  const { isLoggedIn } = useSession()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isLoggedIn) return

    const resetTimeout = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        // Dispatch logout event
        const logoutEvent = new CustomEvent("logout", {
          detail: {
            message: "Your session has expired due to inactivity",
            error: true,
          } as LogoutEventDetail,
        })
        window.dispatchEvent(logoutEvent as Event)
      }, SESSION_TIMEOUT)
    }

    // Reset timeout on user activity
    const activityEvents = ["mousedown", "keypress", "scroll", "touchstart"]

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimeout)
    })

    // Initial timeout
    resetTimeout()

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimeout)
      })
    }
  }, [isLoggedIn])

  return null
}
