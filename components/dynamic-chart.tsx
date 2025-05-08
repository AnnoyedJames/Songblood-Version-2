"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"
import { Skeleton } from "@/components/ui/skeleton"

// Register Chart.js components
Chart.register(...registerables)

interface DynamicChartProps {
  type: "bar" | "line" | "pie" | "doughnut"
  data: any
  options?: any
  height?: string
  width?: string
}

export default function DynamicChart({ type, data, options = {}, height = "100%", width = "100%" }: DynamicChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    // Safety check for data
    if (!data || !data.datasets || !Array.isArray(data.datasets) || !data.labels || !Array.isArray(data.labels)) {
      console.warn("Invalid chart data format", data)
      return
    }

    // Get the canvas context
    const ctx = chartRef.current?.getContext("2d")
    if (!ctx) return

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Create new chart
    try {
      chartInstance.current = new Chart(ctx, {
        type,
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...options,
        },
      })
    } catch (error) {
      console.error("Error creating chart:", error)
    }

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [type, data, options])

  // If no data is provided, show a skeleton loader
  if (!data || !data.datasets || !data.labels) {
    return <Skeleton className="w-full h-full min-h-[200px]" />
  }

  return <canvas ref={chartRef} style={{ height, width }} />
}
