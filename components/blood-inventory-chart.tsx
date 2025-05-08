"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw, BarChart3 } from "lucide-react"
import { DataLoading } from "@/components/data-loading"
import { DataFetchError } from "@/components/data-fetch-error"
import DynamicChart from "./dynamic-chart"

// Define types for inventory data
type InventoryItem = {
  blood_type: string
  rh?: string
  count: number
  total_amount: number
}

interface BloodInventoryChartProps {
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
  // Ensure we always have arrays, even if undefined is passed
  const safeRedBlood = Array.isArray(redBlood) ? redBlood : []
  const safePlasma = Array.isArray(plasma) ? plasma : []
  const safePlatelets = Array.isArray(platelets) ? platelets : []

  const [activeTab, setActiveTab] = useState("units")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Prepare data for charts
  const prepareChartData = (data: InventoryItem[], valueKey: "count" | "total_amount") => {
    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.warn("Chart data is not an array, using empty array instead")
      data = []
    }

    // Group by blood type and sum values
    const groupedData: Record<string, number> = {}

    data.forEach((item) => {
      if (item) {
        const key = item.blood_type + (item.rh ? ` ${item.rh}` : "")
        if (!groupedData[key]) {
          groupedData[key] = 0
        }
        groupedData[key] += Number(item[valueKey] || 0)
      }
    })

    // Convert to chart format
    return {
      labels: Object.keys(groupedData),
      datasets: [
        {
          data: Object.values(groupedData),
          backgroundColor: [
            "rgba(255, 99, 132, 0.7)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(255, 206, 86, 0.7)",
            "rgba(75, 192, 192, 0.7)",
            "rgba(153, 102, 255, 0.7)",
            "rgba(255, 159, 64, 0.7)",
            "rgba(199, 199, 199, 0.7)",
            "rgba(83, 102, 255, 0.7)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgba(199, 199, 199, 1)",
            "rgba(83, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }
  }

  // Prepare chart options with thresholds
  const getChartOptions = (title: string, valueKey: "count" | "total_amount") => {
    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: {
            boxWidth: 12,
          },
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 16,
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.raw
              return valueKey === "count" ? `${value} units` : `${value.toLocaleString()} ml`
            },
          },
        },
      },
    }

    // Add threshold annotations if enabled
    if (showThresholds && valueKey === "count") {
      options.plugins.annotation = {
        annotations: {
          criticalLine: {
            type: "line",
            yMin: 3,
            yMax: 3,
            borderColor: "rgba(255, 0, 0, 0.7)",
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: "Critical (3)",
              position: "start",
              backgroundColor: "rgba(255, 0, 0, 0.7)",
            },
          },
          lowLine: {
            type: "line",
            yMin: 5,
            yMax: 5,
            borderColor: "rgba(255, 165, 0, 0.7)",
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: "Low (5)",
              position: "start",
              backgroundColor: "rgba(255, 165, 0, 0.7)",
            },
          },
        },
      }
    }

    return options
  }

  // Function to refresh data
  const refreshData = async () => {
    // In a real implementation, this would fetch fresh data from the API
    // For now, we'll just simulate a refresh
    setLoading(true)
    setError(null)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update last updated timestamp
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error refreshing data:", err)
      setError(err instanceof Error ? err.message : "Failed to refresh data")
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data based on active tab
  const redBloodChartData = prepareChartData(safeRedBlood, activeTab === "units" ? "count" : "total_amount")
  const plasmaChartData = prepareChartData(safePlasma, activeTab === "units" ? "count" : "total_amount")
  const plateletsChartData = prepareChartData(safePlatelets, activeTab === "units" ? "count" : "total_amount")

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
            Blood Inventory
          </CardTitle>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={refreshData} disabled={loading} className="h-8 px-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="redblood" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="redblood">Red Blood Cells</TabsTrigger>
              <TabsTrigger value="plasma">Plasma</TabsTrigger>
              <TabsTrigger value="platelets">Platelets</TabsTrigger>
            </TabsList>

            <div className="flex">
              <Button
                variant={activeTab === "units" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("units")}
                className="text-xs h-8"
              >
                Units
              </Button>
              <Button
                variant={activeTab === "volume" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("volume")}
                className="text-xs h-8 ml-1"
              >
                Volume
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <DataLoading message="Refreshing chart data..." />
            </div>
          ) : error ? (
            <DataFetchError message="Failed to refresh chart data" details={error} onRetry={refreshData} />
          ) : (
            <>
              <TabsContent value="redblood" className="mt-0">
                <div className="h-[300px]">
                  <DynamicChart
                    type="bar"
                    data={redBloodChartData}
                    options={getChartOptions(
                      activeTab === "units" ? "Red Blood Cell Units by Type" : "Red Blood Cell Volume by Type (ml)",
                      activeTab === "units" ? "count" : "total_amount",
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="plasma" className="mt-0">
                <div className="h-[300px]">
                  <DynamicChart
                    type="bar"
                    data={plasmaChartData}
                    options={getChartOptions(
                      activeTab === "units" ? "Plasma Units by Type" : "Plasma Volume by Type (ml)",
                      activeTab === "units" ? "count" : "total_amount",
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="platelets" className="mt-0">
                <div className="h-[300px]">
                  <DynamicChart
                    type="bar"
                    data={plateletsChartData}
                    options={getChartOptions(
                      activeTab === "units" ? "Platelets Units by Type" : "Platelets Volume by Type (ml)",
                      activeTab === "units" ? "count" : "total_amount",
                    )}
                  />
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
