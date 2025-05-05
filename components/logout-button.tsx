"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { broadcastLogout } from "@/lib/session-utils"

type LogoutButtonProps = {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  mobile?: boolean
  showConfirmation?: boolean
}

export default function LogoutButton({
  variant = "ghost",
  size = "sm",
  className = "",
  mobile = false,
  showConfirmation = true,
}: LogoutButtonProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const { toast } = useToast()

  async function performLogout() {
    if (isLoggingOut) return // Prevent multiple clicks

    setIsLoggingOut(true)

    try {
      // Immediately show a toast notification
      toast({
        title: "Logging out...",
        description: "Please wait while we log you out.",
      })

      // Generate a unique token for this logout request to prevent CSRF
      const logoutToken = Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem("logoutToken", logoutToken)

      // Send logout request to the API
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Logout-Token": logoutToken,
        },
        credentials: "include", // Important for cookies
        cache: "no-store",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Logout failed: ${response.status}`)
      }

      // Clear cookies on the client side for redundancy
      clearClientSideCookies()

      // Broadcast logout to other tabs
      broadcastLogout()

      // Show success toast
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })

      // Clear any cached data
      if (typeof window !== "undefined") {
        // Clear localStorage items related to authentication
        localStorage.removeItem("sessionExpired")
        localStorage.removeItem("lastActivity")

        // Clear any application cache if needed
        try {
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: "CLEAR_AUTH_CACHE" })
          }
        } catch (e) {
          console.error("Error clearing service worker cache:", e)
        }
      }

      // Immediately redirect to login page
      router.push("/login?reason=logout-success")

      // Force a hard navigation to ensure all state is cleared
      setTimeout(() => {
        window.location.href = "/login?reason=logout-success"
      }, 100)
    } catch (error) {
      console.error("Logout error:", error)

      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "There was an issue logging you out. Please try again.",
        variant: "destructive",
      })

      // Even if there's an error, try to redirect to login as a fallback
      setTimeout(() => {
        try {
          router.push("/login?reason=error")

          // Force a hard navigation as a last resort
          setTimeout(() => {
            window.location.href = "/login?reason=error"
          }, 100)
        } catch (e) {
          console.error("Failed to redirect after logout error:", e)
          // Last resort - reload the page
          window.location.reload()
        }
      }, 2000)
    } finally {
      setIsLoggingOut(false)
    }
  }

  function clearClientSideCookies() {
    // Get the domain for proper cookie clearing
    const domain = window.location.hostname
    const isLocalhost = domain === "localhost" || domain === "127.0.0.1"

    // Common cookie paths
    const paths = ["/", "/dashboard", "/login", "/register", "/api"]

    // List of cookies to clear
    const cookiesToClear = [
      "adminId",
      "hospitalId",
      "adminUsername",
      "adminPassword",
      "fallbackMode",
      "sessionToken",
      "authToken",
      "refreshToken",
    ]

    // Clear each cookie with various domain/path combinations for thoroughness
    cookiesToClear.forEach((cookieName) => {
      // Clear with specific domain (except localhost)
      if (!isLocalhost) {
        document.cookie = `  => {
      // Clear with specific domain (except localhost)
      if (!isLocalhost) {
        document.cookie = \`${cookieName}=; domain=${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`
        document.cookie = `${cookieName}=; domain=.${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`
      }

      // Clear with various paths
      paths.forEach((path) => {
        document.cookie = `${cookieName}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`
      })

      // Basic clear for localhost
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict`
    })
  }

  function handleLogout() {
    if (showConfirmation) {
      setShowDialog(true)
    } else {
      performLogout()
    }
  }

  if (mobile) {
    return (
      <>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full text-left flex items-center"
          aria-label="Logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>

        {showConfirmation && (
          <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be logged out of your account and redirected to the login page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={performLogout}>Logout</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </>
    )
  }

  return (
    <>
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

      {showConfirmation && (
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be logged out of your account and redirected to the login page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={performLogout}>Logout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
