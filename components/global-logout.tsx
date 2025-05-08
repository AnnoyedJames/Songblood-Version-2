"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

// This component handles global logout events (e.g., from other tabs)
export default function GlobalLogout() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Function to handle storage events
    function handleStorageChange(event: StorageEvent) {
      if (event.key === "logout" && event.newValue) {
        // Show toast notification
        toast({
          title: "Logged Out",
          description: "You have been logged out in another tab.",
        })

        // Redirect to login page
        router.push("/login")
        router.refresh()
      }
    }

    // Add event listener
    window.addEventListener("storage", handleStorageChange)

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [router, toast])

  return null
}
