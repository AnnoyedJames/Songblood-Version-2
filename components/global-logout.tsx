"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "./session-provider"

export default function GlobalLogout() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, checkSession } = useSession()

  // Listen for storage events to detect logout from other tabs
  useEffect(() => {
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === "logout" && event.newValue === "true") {
        // Another tab logged out, check our session
        const stillAuthenticated = await checkSession()

        if (!stillAuthenticated) {
          toast({
            title: "Logged out in another tab",
            description: "Your session was ended in another browser tab.",
            variant: "default",
          })

          router.push("/login?reason=logged-out-elsewhere")
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [router, toast, checkSession])

  // Add a global keyboard shortcut for logout (Ctrl+Alt+L)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key === "l" && isAuthenticated) {
        event.preventDefault()
        document.getElementById("global-logout-button")?.click()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isAuthenticated])

  return null // This component doesn't render anything
}
