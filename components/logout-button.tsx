"use client"

import { useState } from "react"
import { LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Dispatch a global logout event
        window.dispatchEvent(new CustomEvent("songblood:logout"))
        
        // Redirect to login page
        router.push("/login?reason=logged-out")
      } else {
        console.error("Logout failed")
        setIsLoggingOut(false)
      }
    } catch (error) {
      console.error("Logout error:", error)
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  )
}
