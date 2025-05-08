"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SessionMonitor() {
  const router = useRouter()
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [isActive, setIsActive] = useState<boolean>(true)

  // Update last activity time on user interactions
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now())
      setIsActive(true)
    }

    // Add event listeners for user activity
    window.addEventListener("mousemove", updateActivity)
    window.addEventListener("mousedown", updateActivity)
    window.addEventListener("keypress", updateActivity)
    window.addEventListener("touchmove", updateActivity)
    window.addEventListener("scroll", updateActivity)

    // Check session status periodically
    const checkSessionInterval = setInterval(async () => {
      try {
        // Only check if the user has been inactive for more than 1 minute
        const inactiveTime = Date.now() - lastActivity
        if (inactiveTime > 60000 && isActive) {
          const response = await fetch("/api/check-session")
          const data = await response.json()

          if (!data.valid) {
            // Session expired, redirect to login
            const currentPath = window.location.pathname
            router.push(`/login?reason=session-timeout&returnTo=${encodeURIComponent(currentPath)}`)
            setIsActive(false)
          }
        }
      } catch (error) {
        console.error("Error checking session:", error)
      }
    }, 60000) // Check every minute

    return () => {
      // Clean up event listeners and interval
      window.removeEventListener("mousemove", updateActivity)
      window.removeEventListener("mousedown", updateActivity)
      window.removeEventListener("keypress", updateActivity)
      window.removeEventListener("touchmove", updateActivity)
      window.removeEventListener("scroll", updateActivity)
      clearInterval(checkSessionInterval)
    }
  }, [router, lastActivity, isActive])

  // This component doesn't render anything visible
  return null
}
