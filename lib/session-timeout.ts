"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

type SessionTimeoutOptions = {
  timeoutMinutes?: number
  warningMinutes?: number
  onTimeout?: () => void
  onWarning?: () => void
  onActivity?: () => void
  enabled?: boolean
  preserveFormData?: boolean
}

export function useSessionTimeout({
  timeoutMinutes = 60, // Extended from 30 to 60 minutes
  warningMinutes = 5,
  onTimeout,
  onWarning,
  onActivity,
  enabled = true,
  preserveFormData = true,
}: SessionTimeoutOptions = {}) {
  const router = useRouter()
  const { toast } = useToast()
  const [warningShown, setWarningShown] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [warningToastId, setWarningToastId] = useState<string | null>(null)

  // Convert minutes to milliseconds
  const timeoutMs = timeoutMinutes * 60 * 1000
  const warningMs = warningMinutes * 60 * 1000

  // Reset the timer when there's user activity
  const resetTimer = useCallback(() => {
    setLastActivity(Date.now())
    if (warningShown) {
      setWarningShown(false)
      // Dismiss the warning toast if it exists
      if (warningToastId) {
        toast.dismiss?.(warningToastId)
        setWarningToastId(null)
      }
    }
    if (onActivity) onActivity()
  }, [warningShown, warningToastId, toast, onActivity])

  // Function to save form data before redirecting
  const saveFormData = useCallback(
    (formId: string) => {
      if (!preserveFormData) return

      try {
        // Find all form elements on the page
        const forms = document.querySelectorAll(`form${formId ? `#${formId}` : ""}`)

        forms.forEach((form, formIndex) => {
          const formData: Record<string, any> = {}
          const formElements = form.elements

          // Extract data from form elements
          for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            if (element.name && element.value !== undefined) {
              formData[element.name] = element.value
            }
          }

          // Save form data to sessionStorage with a unique key
          const pageIdentifier = window.location.pathname.replace(/\//g, "_")
          const storageKey = `formData_${pageIdentifier}_${formId || formIndex}`
          sessionStorage.setItem(
            storageKey,
            JSON.stringify({
              timestamp: Date.now(),
              data: formData,
              url: window.location.href,
            }),
          )
        })
      } catch (error) {
        console.error("Error saving form data:", error)
      }
    },
    [preserveFormData],
  )

  // Function to handle session expiration
  const handleSessionExpiration = useCallback(() => {
    if (onTimeout) onTimeout()

    // Save any form data before redirecting
    saveFormData("")

    toast({
      title: "Session expired",
      description: "You have been logged out due to inactivity. Please log in again to continue.",
      variant: "destructive",
      duration: 5000,
    })

    // Perform logout
    fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      // Redirect with context about the page they were on
      const currentPath = encodeURIComponent(window.location.pathname + window.location.search)
      router.push(`/login?reason=session-timeout&returnTo=${currentPath}`)
    })
  }, [onTimeout, saveFormData, toast, router])

  // Function to check session validity with the server
  const checkServerSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/check-session", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) return false

      const data = await response.json()
      return data.authenticated === true
    } catch (error) {
      console.error("Error checking session validity:", error)
      return false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Set up event listeners for user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
      "focus",
      "input",
      "change",
    ]

    const handleActivity = () => {
      resetTimer()
    }

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Check for inactivity
    const interval = setInterval(async () => {
      const now = Date.now()
      const elapsed = now - lastActivity

      // Show warning before timeout
      if (elapsed > timeoutMs - warningMs && !warningShown) {
        setWarningShown(true)

        // Check with server if session is still valid
        const isSessionValid = await checkServerSession()

        if (!isSessionValid) {
          // Session already expired on server
          handleSessionExpiration()
          clearInterval(interval)
          return
        }

        // Create the action component for the toast
        const actionComponent = (
          <Button variant="outline" size="sm" onClick={resetTimer}>
            Keep me logged in
          </Button>
        )

        // Show warning toast
        const id = toast({
          title: "Session expiring soon",
          description: `Your session will expire in ${warningMinutes} minutes due to inactivity.`,
          variant: "warning",
          duration: warningMs,
          action: actionComponent,
        }).id

        setWarningToastId(id)

        if (onWarning) onWarning()
      }

      // Timeout - log the user out
      if (elapsed > timeoutMs) {
        handleSessionExpiration()
        clearInterval(interval)
      }
    }, 10000) // Check every 10 seconds

    // Periodically check server-side session validity (every 2 minutes)
    const serverCheckInterval = setInterval(async () => {
      const isSessionValid = await checkServerSession()

      if (!isSessionValid) {
        handleSessionExpiration()
        clearInterval(interval)
        clearInterval(serverCheckInterval)
      }
    }, 120000)

    // Clean up
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      clearInterval(interval)
      clearInterval(serverCheckInterval)
    }
  }, [
    lastActivity,
    timeoutMs,
    warningMs,
    warningShown,
    resetTimer,
    handleSessionExpiration,
    checkServerSession,
    toast,
    onWarning,
    enabled,
  ])

  return {
    resetTimer,
    timeRemaining: Math.max(0, timeoutMs - (Date.now() - lastActivity)),
    isWarning: warningShown,
    saveFormData,
  }
}
