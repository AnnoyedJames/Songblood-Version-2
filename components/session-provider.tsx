"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type SessionContextType = {
  isAuthenticated: boolean
  username: string | null
  hospitalId: number | null
  hospitalName: string | null
  role: string | null
  loading: boolean
}

const defaultSessionContext: SessionContextType = {
  isAuthenticated: false,
  username: null,
  hospitalId: null,
  hospitalName: null,
  role: null,
  loading: true,
}

const SessionContext = createContext<SessionContextType>(defaultSessionContext)

export const useSession = () => useContext(SessionContext)

export default function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionContextType>(defaultSessionContext)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/check-session")
        const data = await res.json()

        setSession({
          isAuthenticated: data.valid,
          username: data.username || null,
          hospitalId: data.hospitalId || null,
          hospitalName: data.hospitalName || null,
          role: data.role || null,
          loading: false,
        })
      } catch (error) {
        console.error("Error fetching session:", error)
        setSession({
          ...defaultSessionContext,
          loading: false,
        })
      }
    }

    fetchSession()
  }, [])

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
