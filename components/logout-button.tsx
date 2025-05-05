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
      // Send logout request to the API
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Logout failed: ${response.status}`)
      }

      // Show success toast
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })

      // Immediately redirect to login page
      router.push("/login?reason=logout-success")
    } catch (error) {
      console.error("Logout error:", error)

      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error instanceof Error ? error.message : "There was an issue logging you out. Please try again.",
      })

      // Even if there's an error, try to redirect to login as a fallback
      router.push("/login?reason=error")
    } finally {
      setIsLoggingOut(false)
    }
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
