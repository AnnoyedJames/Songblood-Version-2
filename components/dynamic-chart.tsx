"use client"

import { useEffect, useRef } from "react"
import { Chart, type ChartConfiguration, type ChartData, type ChartOptions } from "chart.js/auto"

type InventoryItem = {
  blood_type: string
  rh?: string
  count: number
  total_amount: number
}

type DynamicChartProps = {
  redBlood: InventoryItem[]
  plasma: InventoryItem[]
  platelets: InventoryItem[]
  showThresholds?: boolean
}

export default function DynamicChart({ redBlood, plasma, platelets, showThresholds = true }: DynamicChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Process data for the chart
    const bloodTypes = Array.from(
      new Set([
        ...redBlood.map((item) => `${item.blood_type}${item.rh ? item.rh : ""}`),
        ...plasma.map((item) => item.blood_type),
        ...platelets.map((item) => `${item.blood_type}${item.rh ? item.rh : ""}`),
      ]),
    ).sort()

    // Prepare datasets
    const datasets = [
      {
        label: "Red Blood Cells",
        data: bloodTypes.map((type) => {
          const item = redBlood.find((item) => `${item.blood_type}${item.rh ? item.rh : ""}` === type)
          return item ? item.total_amount : 0
        }),
        backgroundColor: "rgba(220, 38, 38, 0.5)",
        borderColor: "rgba(220, 38, 38, 1)",
        borderWidth: 1,
      },
      {
        label: "Plasma",
        data: bloodTypes.map((type) => {
          const item = plasma.find((item) => item.blood_type === type)
          return item ? item.total_amount : 0
        }),
        backgroundColor: "rgba(245, 158, 11, 0.5)",
        borderColor: "rgba(245, 158, 11, 1)",
        borderWidth: 1,
      },
      {
        label: "Platelets",
        data: bloodTypes.map((type) => {
          const item = platelets.find((item) => `${item.blood_type}${item.rh ? item.rh : ""}` === type)
          return item ? item.total_amount : 0
        }),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ]

    // Add threshold annotations if enabled
    const annotations: any = {}

    if (showThresholds) {
      annotations.lowThreshold = {
        type: "line",
        yMin: 1500,
        yMax: 1500,
        borderColor: "rgba(245, 158, 11, 0.7)",
        borderWidth: 2,
        borderDash: [6, 6],
        label: {
          content: "Low (1500ml)",
          enabled: true,
          position: "end",
          backgroundColor: "rgba(245, 158, 11, 0.7)",
        },
      }

      annotations.criticalThreshold = {
        type: "line",
        yMin: 500,
        yMax: 500,
        borderColor: "rgba(220, 38, 38, 0.7)",
        borderWidth: 2,
        borderDash: [6, 6],
        label: {
          content: "Critical (500ml)",
          enabled: true,
          position: "end",
          backgroundColor: "rgba(220, 38, 38, 0.7)",
        },
      }
    }

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Volume (ml)",
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
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw as number
              return `${context.dataset.label}: ${value.toLocaleString()} ml`
            },
          },
        },
        annotation: {
          annotations: annotations,
        },
      },
    }

    const data: ChartData = {
      labels: bloodTypes,
      datasets: datasets,
    }

    const config: ChartConfiguration = {
      type: "bar",
      data: data,
      options: options,
    }

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Create new chart
    chartInstance.current = new Chart(chartRef.current, config)

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [redBlood, plasma, platelets, showThresholds])

  return <canvas ref={chartRef} />
}
