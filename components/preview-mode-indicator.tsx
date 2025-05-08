"use client"

import { useState, useEffect } from "react"
import { AlertCircle } from "lucide-react"

export default function PreviewModeIndicator() {
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    // Check if we're in a preview environment
    if (
      typeof window !== "undefined" &&
      (window.location.hostname.includes("vercel.app") || window.location.hostname.includes("localhost"))
    ) {
      setIsPreview(true)
    }
  }, [])

  if (!isPreview) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-100 text-amber-800 py-2 px-4 text-center text-sm z-50 flex items-center justify-center">
      <AlertCircle className="h-4 w-4 mr-2" />
      <span>Preview Mode: Using mock data. Database operations are simulated.</span>
    </div>
  )
}
