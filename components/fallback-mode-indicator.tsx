"use client"

import { useEffect, useState } from "react"

export default function FallbackModeIndicator() {
  const [isFallbackMode, setIsFallbackMode] = useState(false)

  useEffect(() => {
    // Check if fallback mode is enabled (e.g., from localStorage or cookies)
    const fallback = localStorage.getItem("fallbackMode") === "true"
    setIsFallbackMode(fallback)

    // Listen for changes to fallback mode in localStorage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "fallbackMode") {
        setIsFallbackMode(event.newValue === "true")
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  if (!isFallbackMode) {
    return null
  }

  return (
    <div className="text-sm text-orange-500">
      <span className="font-semibold">Fallback Mode</span> - Some features may be limited.
    </div>
  )
}
