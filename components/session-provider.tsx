"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import GlobalLogout from "./global-logout"
import SessionMonitor from "./session-monitor"

// Define the type for the session context
type SessionContextType = {
  isLoggedIn: boolean
  setIsLoggedIn: (value: boolean) => void
  username: string | null
  setUsername: (value: string | null) => void
  hospital: string | null
  setHospital: (value: string | null) => void
}

// Create the context with a default value
const SessionContext = createContext<SessionContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  username: null,
  setUsername: () => {},
  hospital: null,
  setHospital: () => {},
})

// Custom hook to use the session context
export const useSession = () => useContext(SessionContext)

// Session provider component
export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [hospital, setHospital] = useState<string | null>(null)

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("authToken")
      const storedUsername = localStorage.getItem("username")
      const storedHospital = localStorage.getItem("hospital")

      if (token) {
        setIsLoggedIn(true)
        setUsername(storedUsername)
        setHospital(storedHospital)
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
        hospital,
        setHospital,
      }}
    >
      {children}
      {isLoggedIn && <GlobalLogout />}
      {isLoggedIn && <SessionMonitor />}
    </SessionContext.Provider>
  )
}
