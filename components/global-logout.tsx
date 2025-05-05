"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLogoutListener } from "@/lib/session-utils"

export default function GlobalLogout() {
  const router = useRouter()

  // Use our enhanced logout listener
  useLogoutListener()

  useEffect(() => {
    // Handle logout from localStorage (for backward compatibility)
    const checkForLogout = () => {
      if (localStorage.getItem("logout") === "true") {
        console.log("Logout detected from localStorage")
        localStorage.removeItem("logout")

        // Clear any client-side state
        router.push("/login?reason=logout-global")

        // Force a hard navigation
        setTimeout(() => {
          window.location.href = "/login?reason=logout-global"
        }, 100)
      }
    }

    // Check immediately
    checkForLogout()

    // Set up interval to check periodically
    const interval = setInterval(checkForLogout, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [router])

  return null
}
