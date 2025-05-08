"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function GlobalLogout() {
  const router = useRouter()

  useEffect(() => {
    // Listen for the custom logout event
    const handleLogout = (event: CustomEvent) => {
      // Redirect to login page
      router.push("/login?reason=logged-out")
    }

    // Add event listener for the custom event
    window.addEventListener("songblood:logout" as any, handleLogout as EventListener)

    // Clean up
    return () => {
      window.removeEventListener("songblood:logout" as any, handleLogout as EventListener)
    }
  }, [router])

  // This component doesn't render anything visible
  return null
}
