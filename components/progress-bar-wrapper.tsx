"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

// Dynamically import the ProgressBar component with no SSR
const ProgressBar = dynamic(() => import("@/components/progress-bar"), {
  ssr: false,
})

export default function ProgressBarWrapper() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  )
}
