"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { LogOut } from "lucide-react"

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to parse as JSON first
        let errorData
        try {
          errorData = await response.json()
        } catch (jsonError) {
          // If JSON parsing fails, use the status text or a generic message
          const errorText = await response.text()
          console.error("Non-JSON error response:", errorText)

          toast({
            title: "Logout Error",
            description: `Server error: ${response.status} ${response.statusText || "Unknown error"}`,
            variant: "destructive",
          })
          return
        }

        // Handle JSON error responses
        toast({
          title: "Logout Error",
          description: errorData.error || "An error occurred during logout. Please try again.",
          variant: "destructive",
        })
        return
      }

      // For successful responses, parse JSON
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("Error parsing successful response:", jsonError)
        toast({
          title: "Logout Error",
          description: "The server returned an invalid response. Please try again later.",
          variant: "destructive",
        })
        return
      }

      // Logout successful
      toast({
        title: "Logout Successful",
        description: "You have been logged out successfully.",
      })

      // Redirect to login page
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your internet connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
    </Button>
  )
}
