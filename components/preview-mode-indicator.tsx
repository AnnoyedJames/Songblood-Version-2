"use client"

import { useEffect, useState } from "react"

export default function PreviewModeIndicator() {
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    // Check if we're in a preview environment
    const isPreviewEnv =
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
      window.location.hostname.includes("vercel.app") ||
      window.location.hostname.includes("localhost")

    setIsPreview(isPreviewEnv)
  }, [])

  if (!isPreview) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-500 text-white text-center py-1 text-sm z-50">
      Preview Mode: Using mock data - No database connection required
    </div>
  )
}
