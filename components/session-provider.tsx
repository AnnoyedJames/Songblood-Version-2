"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSessionTimeout } from "@/lib/session-timeout"
import { useToast } from "@/components/ui/use-toast"

type SessionContextType = {
  isAuthenticated: boolean
  logout: () => Promise<void>
  checkSession: () => Promise<boolean>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({
  children,
  initialAuth = false,
  sessionTimeoutMinutes = 30,
}: {
  children: React.ReactNode
  initialAuth?: boolean
  sessionTimeoutMinutes?: number
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Set up session timeout
  useSessionTimeout({
    timeoutMinutes: sessionTimeoutMinutes,
    enabled: isAuthenticated,
  })

  // Check session status
  const checkSession = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/check-session", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        setIsAuthenticated(false)
        return false
      }

      const data = await response.json()
      setIsAuthenticated(data.authenticated)
      return data.authenticated
    } catch (error) {
      console.error("Error checking session:", error)
      setIsAuthenticated(false)
      return false
    }
  }

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      })

      setIsAuthenticated(false)

      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
        variant: "success",
      })

      router.push("/login?reason=logout-success")

      // Force a hard navigation to ensure all state is cleared
      setTimeout(() => {
        window.location.href = "/login?reason=logout-success"
      }, 100)
    } catch (error) {
      console.error("Logout error:", error)

      toast({
        title: "Logout failed",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive",
      })

      // Even if there's an error, try to redirect to login
      router.push("/login?reason=error")
    }
  }

  // Check session on mount and when pathname changes
  useEffect(() => {
    // Skip session check for public routes
    const isPublicRoute = pathname === "/login" || pathname === "/register"

    if (!isPublicRoute) {
      checkSession()
    }
  }, [pathname])

  return <SessionContext.Provider value={{ isAuthenticated, logout, checkSession }}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)

  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }

  return context
}
