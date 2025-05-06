"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type SessionContextType = {
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  lastActivity: number
  updateLastActivity: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}

export default function SessionProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())

  const updateLastActivity = () => {
    setLastActivity(Date.now())
  }

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/check-session")
        if (response.ok) {
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Failed to check authentication status:", error)
      }
    }

    checkAuth()
  }, [])

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        lastActivity,
        updateLastActivity,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
