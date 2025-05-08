"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Register Chart.js components
Chart.register(...registerables)

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
  redBlood = [],
  plasma = [],
  platelets = [],
  showThresholds = false,
  className = "",
}: BloodInventoryChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const [chartInstance, setChartInstance] = useState<Chart | null>(null)

  // Process data for the chart
  const processData = () => {
    // Ensure all arrays are defined
    const safeRedBlood = Array.isArray(redBlood) ? redBlood : []
    const safePlasma = Array.isArray(plasma) ? plasma : []
    const safePlatelets = Array.isArray(platelets) ? platelets : []

    // Get all unique blood types across all inventories
    const allBloodTypes = new Set<string>()

    safeRedBlood.forEach((item) => {
      allBloodTypes.add(`${item.blood_type}${item.rh || ""}`)
    })

    safePlasma.forEach((item) => {
      allBloodTypes.add(item.blood_type)
    })

    safePlatelets.forEach((item) => {
      allBloodTypes.add(`${item.blood_type}${item.rh || ""}`)
    })

    // Convert to sorted array
    const bloodTypes = Array.from(allBloodTypes).sort()

    // Prepare data for each blood type
    const redBloodData = bloodTypes.map((type) => {
      const matchingItems = safeRedBlood.filter((item) => `${item.blood_type}${item.rh || ""}` === type)
      return matchingItems.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
    })

    const plasmaData = bloodTypes.map((type) => {
      // For plasma, we only match on blood_type (no rh)
      const matchingItems = safePlasma.filter((item) => item.blood_type === type.replace(/[+-]/, ""))
      return matchingItems.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
    })

    const plateletsData = bloodTypes.map((type) => {
      const matchingItems = safePlatelets.filter((item) => `${item.blood_type}${item.rh || ""}` === type)
      return matchingItems.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
    })

    return {
      labels: bloodTypes,
      redBloodData,
      plasmaData,
      plateletsData,
    }
  }

  useEffect(() => {
    if (!chartRef.current) return

    // Clean up previous chart instance
    if (chartInstance) {
      chartInstance.destroy()
    }

    const { labels, redBloodData, plasmaData, plateletsData } = processData()

    // Create new chart
    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    const newChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Red Blood Cells",
            data: redBloodData,
            backgroundColor: "rgba(239, 68, 68, 0.7)",
            borderColor: "rgba(239, 68, 68, 1)",
            borderWidth: 1,
          },
          {
            label: "Plasma",
            data: plasmaData,
            backgroundColor: "rgba(245, 158, 11, 0.7)",
            borderColor: "rgba(245, 158, 11, 1)",
            borderWidth: 1,
          },
          {
            label: "Platelets",
            data: plateletsData,
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Amount (ml)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Blood Type",
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number
                return `${context.dataset.label}: ${value.toLocaleString()} ml`
              },
            },
          },
          annotation: showThresholds
            ? {
                annotations: {
                  criticalLine: {
                    type: "line",
                    yMin: 500,
                    yMax: 500,
                    borderColor: "rgba(239, 68, 68, 0.5)",
                    borderWidth: 2,
                    borderDash: [6, 6],
                    label: {
                      display: true,
                      content: "Critical (500ml)",
                      position: "start",
                    },
                  },
                  lowLine: {
                    type: "line",
                    yMin: 1500,
                    yMax: 1500,
                    borderColor: "rgba(245, 158, 11, 0.5)",
                    borderWidth: 2,
                    borderDash: [6, 6],
                    label: {
                      display: true,
                      content: "Low (1500ml)",
                      position: "start",
                    },
                  },
                },
              }
            : {},
        },
      },
    })

    setChartInstance(newChartInstance)

    // Cleanup on unmount
    return () => {
      if (newChartInstance) {
        newChartInstance.destroy()
      }
    }
  }, [redBlood, plasma, platelets, showThresholds])

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Blood Inventory Overview</CardTitle>
        <CardDescription>Total amount of each blood type in milliliters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <canvas ref={chartRef} />
        </div>
      </CardContent>
    </Card>
  )
}
