"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function GlobalLogout() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Listen for logout events from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "songblood_logout" && event.newValue) {
        // Show toast notification
        toast({
          title: "Logged out",
          description: "You have been logged out from another tab.",
          variant: "destructive",
        })

        // Redirect to login page
        router.push("/login?reason=logout-global")
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [router, toast])

  return null
}
