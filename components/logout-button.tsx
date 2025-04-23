"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

type LogoutButtonProps = {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  mobile?: boolean
}

export default function LogoutButton({
  variant = "ghost",
  size = "sm",
  className = "",
  mobile = false,
}: LogoutButtonProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      // Send logout request to the API
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // If the API call was successful, clear cookies on the client side as well
        document.cookie = "adminId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "hospitalId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "fallbackMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "adminUsername=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "adminPassword=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

        // Redirect to login page
        router.push("/login?logged_out=true")
        router.refresh()
      } else {
        console.error("Logout failed:", response.statusText)
        // Even if the API call fails, try to redirect to login
        router.push("/login")
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Even if there's an error, try to redirect to login
      router.push("/login")
    }
  }

  if (mobile) {
    return (
      <button onClick={handleLogout} disabled={isLoggingOut} className="w-full text-left flex items-center">
        <LogOut className="mr-2 h-4 w-4" />
        {isLoggingOut ? "Logging out..." : "Logout"}
      </button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-1 ${className}`}
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      <LogOut className="h-4 w-4" />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  )
}
