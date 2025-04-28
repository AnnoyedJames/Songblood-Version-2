"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type LogoutButtonProps = {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  mobile?: boolean
}

export function LogoutButton({ variant = "ghost", size = "sm", className = "", mobile = false }: LogoutButtonProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { toast } = useToast()

  async function handleLogout() {
    if (isLoggingOut) return // Prevent multiple clicks

    setIsLoggingOut(true)

    try {
      // Immediately show a toast notification
      toast({
        title: "Logging out...",
        description: "Please wait while we log you out.",
        variant: "default",
      })

      // Send logout request to the API
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
      })

      // Clear cookies on the client side for redundancy
      document.cookie = "adminId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict"
      document.cookie = "hospitalId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict"
      document.cookie = "adminUsername=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict"
      document.cookie = "adminPassword=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict"
      document.cookie = "fallbackMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict"
      document.cookie = "sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict"

      // Immediately redirect to login page
      router.push("/login?reason=logout-success")

      // Force a hard navigation to ensure all state is cleared
      setTimeout(() => {
        window.location.href = "/login?reason=logout-success"
      }, 100)
    } catch (error) {
      console.error("Logout error:", error)

      // Even if there's an error, redirect to login
      router.push("/login?reason=error")

      // Force a hard navigation as fallback
      setTimeout(() => {
        window.location.href = "/login?reason=error"
      }, 100)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (mobile) {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full text-left flex items-center"
        aria-label="Logout"
      >
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
      aria-label="Logout"
    >
      <LogOut className="h-4 w-4" />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  )
}
