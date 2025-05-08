"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Function to check if a session is valid
export async function checkSessionValidity(): Promise<boolean> {
  try {
    const response = await fetch("/api/check-session", {
      method: "GET",
      credentials: "include",
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

    return () => {
      clearInterval(interval)
    }
  }, [router, intervalMs])
}

// Function to broadcast logout to other tabs
export function broadcastLogout() {
  localStorage.setItem("logout", "true")
  // Clear it after a short delay
  setTimeout(() => {
    localStorage.removeItem("logout")
  }, 1000)
}
