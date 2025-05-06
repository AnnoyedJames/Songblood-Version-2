"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import GlobalLogout from "./global-logout"
import SessionMonitor from "./session-monitor"

// List of paths that don't require authentication
const publicPaths = ["/login", "/register"]

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Check if the current path is public
  const isPublicPath = publicPaths.includes(pathname || "")

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/check-session", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          setIsAuthenticated(true)

          // If on a public path but authenticated, redirect to dashboard
          if (isPublicPath) {
            router.push("/dashboard")
          }
        } else {
          setIsAuthenticated(false)

          // If not on a public path and not authenticated, redirect to login
          if (!isPublicPath) {
            toast({
              title: "Authentication Required",
              description: "Please log in to access this page.",
              variant: "destructive",
            })
            router.push(`/login?returnTo=${encodeURIComponent(pathname || "/")}`)
          }
        }
      } catch (error) {
        console.error("Error checking session:", error)
        setIsAuthenticated(false)

        // Show error toast
        toast({
          title: "Connection Error",
          description: "Unable to verify your session. Please try again later.",
          variant: "destructive",
        })

        // If not on a public path, redirect to login
        if (!isPublicPath) {
          router.push(`/login?returnTo=${encodeURIComponent(pathname || "/")}`)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [isPublicPath, pathname, router, toast])

  // Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // If authenticated or on a public path, render the children
  if (isAuthenticated || isPublicPath) {
    return (
      <>
        {children}
        {isAuthenticated && (
          <>
            <GlobalLogout />
            <SessionMonitor />
          </>
        )}
      </>
    )
  }

  // Otherwise, render nothing (will redirect to login)
  return null
}
