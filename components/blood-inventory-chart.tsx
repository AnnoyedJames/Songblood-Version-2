"use client"

import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"

// Dynamically import the chart component
const DynamicChart = dynamic(() => import("./dynamic-chart"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-96" />,
})

type InventoryItem = {
  blood_type: string
  rh?: string
  count: number
  total_amount: number
}

type BloodInventoryChartProps = {
  redBlood: InventoryItem[]
  plasma: InventoryItem[]
  platelets: InventoryItem[]
  showThresholds?: boolean
  className?: string
}

export default function BloodInventoryChart({
  redBlood,
  plasma,
  platelets,
  showThresholds = true,
  className = "",
}: BloodInventoryChartProps) {
  return (
    <div className={`w-full h-96 bg-white p-4 rounded-lg shadow ${className}`}>
      <Suspense fallback={<Skeleton className="w-full h-96" />}>
        <DynamicChart redBlood={redBlood} plasma={plasma} platelets={platelets} showThresholds={showThresholds} />
      </Suspense>
    </div>
  )
}
