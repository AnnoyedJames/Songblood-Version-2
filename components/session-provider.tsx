"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { usePathname } from "next/navigation"

interface SessionContextType {
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  checkSession: () => Promise<boolean>
  loading: boolean
  resetTimer?: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Check session status on initial load
  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        const result = await checkSession()
        setIsAuthenticated(result)
      } catch (error) {
        console.error("Error checking session:", error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkInitialSession()
  }, [])

  // Function to check if the user is still authenticated
  const checkSession = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/check-session", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.authenticated === true
    } catch (error) {
      console.error("Session check error:", error)
      return false
    }
  }

  return (
    <SessionContext.Provider value={{ isAuthenticated, setIsAuthenticated, checkSession, loading }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
