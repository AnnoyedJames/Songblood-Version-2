"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "./session-provider"
import { useToast } from "@/components/ui/use-toast"

interface LogoutEventDetail {
  message?: string
  error?: boolean
}

export default function GlobalLogout() {
  const router = useRouter()
  const { setIsLoggedIn, setUsername, setHospital } = useSession()
  const { toast } = useToast()

  useEffect(() => {
    // Listen for the custom logout event
    const handleLogout = (event: CustomEvent<LogoutEventDetail>) => {
      // Clear auth data
      localStorage.removeItem("authToken")
      localStorage.removeItem("username")
      localStorage.removeItem("hospital")

      // Update session context
      setIsLoggedIn(false)
      setUsername(null)
      setHospital(null)

      // Show toast notification
      toast({
        title: "Logged out",
        description: event.detail?.message || "You have been logged out successfully.",
        variant: event.detail?.error ? "destructive" : "default",
      })

      // Redirect to login page
      router.push("/login")
    }

    // Add event listener
    window.addEventListener("logout" as any, handleLogout as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener("logout" as any, handleLogout as EventListener)
    }
  }, [router, setIsLoggedIn, setUsername, setHospital, toast])

  return null
}
