"use client"

import { type ReactNode, useEffect, createContext, useContext, useState } from "react"
import { useSessionTimeout } from "@/lib/session-timeout"
import { usePathname } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface SessionProviderProps {
  children: ReactNode
  timeoutMinutes?: number
  warningMinutes?: number
}

interface SessionContextType {
  resetTimer: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export default function SessionProvider({
  children,
  timeoutMinutes = 60, // Extended from 30 to 60 minutes
  warningMinutes = 5,
}: SessionProviderProps) {
  const pathname = usePathname()
  const { toast } = useToast()
  const [resetTimerFunction, setResetTimerFunction] = useState<(() => void) | null>(null)

  // Skip session timeout on login and register pages
  const isAuthPage = pathname === "/login" || pathname === "/register"

  // Use session timeout hook
  const { resetTimer } = useSessionTimeout({
    timeoutMinutes,
    warningMinutes,
    enabled: !isAuthPage,
    preserveFormData: true,
  })

  useEffect(() => {
    setResetTimerFunction(() => resetTimer)
  }, [resetTimer])

  // Check for form data to restore on page load
  useEffect(() => {
    if (isAuthPage) return

    try {
      const pageIdentifier = pathname.replace(/\//g, "_")
      const storageKeyPrefix = `formData_${pageIdentifier}_`

      // Look for saved form data for this page
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith(storageKeyPrefix)) {
          const savedData = JSON.parse(sessionStorage.getItem(key) || "{}")

          // Check if data is less than 30 minutes old
          const isRecent = Date.now() - savedData.timestamp < 30 * 60 * 1000

          if (isRecent) {
            // Show toast notification about form data
            toast({
              title: "Form data recovered",
              description: "We've restored your previously entered data.",
              duration: 5000,
              action: (
                <button
                  onClick={() => {
                    sessionStorage.removeItem(key)
                    window.location.reload()
                  }}
                  className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md hover:bg-destructive/90 transition-colors"
                >
                  Discard
                </button>
              ),
            })

            // Wait for DOM to be ready
            setTimeout(() => {
              // Find the form and restore data
              const formId = key.split("_").pop()
              const form = document.getElementById(formId) as HTMLFormElement

              if (form) {
                Object.entries(savedData.data).forEach(([name, value]) => {
                  const element = form.elements.namedItem(name) as
                    | HTMLInputElement
                    | HTMLSelectElement
                    | HTMLTextAreaElement
                  if (element) {
                    element.value = value as string
                  }
                })
              }
            }, 500)

            // Remove the saved data
            sessionStorage.removeItem(key)
            break
          } else {
            // Remove old data
            sessionStorage.removeItem(key)
          }
        }
      }
    } catch (error) {
      console.error("Error restoring form data:", error)
    }
  }, [pathname, toast, isAuthPage])

  // Listen for storage events (for cross-tab logout)
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "logout" && event.newValue === "true") {
        window.location.href = "/login?reason=logged-out-in-another-tab"
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  return (
    <SessionContext.Provider value={{ resetTimer: resetTimerFunction || (() => {}) }}>
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
