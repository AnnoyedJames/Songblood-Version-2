"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Function to check if a session is valid
export async function checkSessionValidity(): Promise<boolean> {
  try {
    const response = await fetch("/api/check-session", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.authenticated
  } catch (error) {
    console.error("Error checking session validity:", error)
    return false
  }
}

// Hook to periodically check session validity
export function useSessionCheck(intervalMs = 60000) {
  const router = useRouter()

  useEffect(() => {
    // Skip on login and register pages
    if (window.location.pathname === "/login" || window.location.pathname === "/register") {
      return
    }

    const checkSession = async () => {
      const isValid = await checkSessionValidity()

      if (!isValid) {
        // Session is invalid, redirect to login
        localStorage.setItem("sessionExpired", "true")
        router.push("/login?reason=session-expired")
      }
    }

    // Check immediately on mount
    checkSession()

    // Set up interval for periodic checks
    const interval = setInterval(checkSession, intervalMs)

    // Listen for logout events from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "logout" && event.newValue === "true") {
        console.log("Logout detected from another tab")
        // Clear any local state
        router.push("/login?reason=logout-from-other-tab")

        // Force a hard navigation to ensure all state is cleared
        setTimeout(() => {
          window.location.href = "/login?reason=logout-from-other-tab"
        }, 100)
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [router, intervalMs])
}

// Enhanced function to broadcast logout to other tabs
export function broadcastLogout() {
  try {
    // Use localStorage for cross-tab communication
    localStorage.setItem("logout", "true")

    // Clear it after a short delay
    setTimeout(() => {
      localStorage.removeItem("logout")
    }, 1000)

    // Also try to use BroadcastChannel API for modern browsers
    if (typeof BroadcastChannel !== "undefined") {
      const logoutChannel = new BroadcastChannel("logout_channel")
      logoutChannel.postMessage({ type: "LOGOUT", timestamp: Date.now() })

      // Close the channel after sending
      setTimeout(() => {
        logoutChannel.close()
      }, 1000)
    }

    console.log("Broadcast logout signal to other tabs")
    return true
  } catch (error) {
    console.error("Error broadcasting logout:", error)
    return false
  }
}

// Add a hook to listen for logout broadcasts
export function useLogoutListener() {
  const router = useRouter()

  useEffect(() => {
    // Skip on login and register pages
    if (window.location.pathname === "/login" || window.location.pathname === "/register") {
      return
    }

    // Listen for localStorage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "logout" && event.newValue === "true") {
        console.log("Logout detected from another tab via localStorage")
        router.push("/login?reason=logout-from-other-tab")
      }
    }

    // Listen for BroadcastChannel messages
    let logoutChannel: BroadcastChannel | null = null

    if (typeof BroadcastChannel !== "undefined") {
      logoutChannel = new BroadcastChannel("logout_channel")
      logoutChannel.onmessage = (event) => {
        if (event.data.type === "LOGOUT") {
          console.log("Logout detected from another tab via BroadcastChannel")
          router.push("/login?reason=logout-from-other-tab")
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      if (logoutChannel) {
        logoutChannel.close()
      }
    }
  }, [router])
}

// Add the missing export for session data
export function getSessionData() {
  try {
    // Get session data from localStorage
    const sessionData = localStorage.getItem("sessionData")
    if (!sessionData) return null

    return JSON.parse(sessionData)
  } catch (error) {
    console.error("Error getting session data:", error)
    return null
  }
}
