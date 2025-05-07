"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Define the type for the session context
type SessionContextType = {
  isLoggedIn: boolean
  setIsLoggedIn: (value: boolean) => void
  username: string | null
  setUsername: (value: string | null) => void
  hospitalId: number | null
  setHospitalId: (value: number | null) => void
}

// Create the context with a default value
const SessionContext = createContext<SessionContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  username: null,
  setUsername: () => {},
  hospitalId: null,
  setHospitalId: () => {},
})

// Custom hook to use the session context
export const useSession = () => useContext(SessionContext)

// Session provider component
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [hospitalId, setHospitalId] = useState<number | null>(null)

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkLoginStatus = () => {
      const storedUsername = localStorage.getItem("username")
      const storedHospitalId = localStorage.getItem("hospitalId")

      if (storedUsername && storedHospitalId) {
        setIsLoggedIn(true)
        setUsername(storedUsername)
        setHospitalId(Number(storedHospitalId))
      }
    }

    checkLoginStatus()
  }, [])

  return (
    <SessionContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        username,
        setUsername,
        hospitalId,
        setHospitalId,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
