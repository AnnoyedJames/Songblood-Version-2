"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SurplusSummary } from "@/lib/surplus-utils"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Droplets } from "lucide-react"
import Link from "next/link"

type SurplusSummaryCardProps = {
  initialSummary: SurplusSummary
  hospitalId: number
  refreshInterval?: number
  className?: string
}

export default function SurplusSummaryCard({
  initialSummary,
  hospitalId,
  refreshInterval = 60000, // Default to 1 minute
  className = "",
}: SurplusSummaryCardProps) {
  const [summary, setSummary] = useState<SurplusSummary>(initialSummary)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/surplus/summary?hospitalId=${hospitalId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch surplus summary")
        }

        const data = await response.json()
        setSummary(data)
      } catch (err) {
        console.error("Error fetching surplus summary:", err)
        setError("Failed to refresh surplus summary")
      } finally {
        setLoading(false)
      }
    }

    // Set up interval for periodic updates
    const intervalId = setInterval(fetchSummary, refreshInterval)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [hospitalId, refreshInterval])

  // Helper function to render inventory status
  const renderInventoryStatus = (type: "redBlood" | "plasma" | "platelets") => {
    const data = summary[type]
    const total = data.surplus + data.optimal + data.low + data.critical

    if (total === 0) {
      return (
        <div className="flex items-center justify-center p-4 text-muted-foreground">
          No {type === "redBlood" ? "red blood cell" : type} inventory data available.
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <span className="font-medium">Optimal or Surplus</span>
            </div>
            <div className="text-2xl font-bold mt-1">{data.surplus + data.optimal}</div>
            <div className="text-sm text-muted-foreground">blood types</div>
          </div>

          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="font-medium">Low or Critical</span>
            </div>
            <div className="text-2xl font-bold mt-1">{data.low + data.critical}</div>
            <div className="text-sm text-muted-foreground">blood types</div>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Surplus</span>
              <span className="font-medium">{data.surplus}</span>
            </div>
            <Progress
              value={(data.surplus / total) * 100}
              className="h-2 bg-gray-100"
              indicatorClassName="bg-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Optimal</span>
              <span className="font-medium">{data.optimal}</span>
            </div>
            <Progress
              value={(data.optimal / total) * 100}
              className="h-2 bg-gray-100"
              indicatorClassName="bg-green-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Low</span>
              <span className="font-medium">{data.low}</span>
            </div>
            <Progress value={(data.low / total) * 100} className="h-2 bg-gray-100" indicatorClassName="bg-amber-500" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Critical</span>
              <span className="font-medium">{data.critical}</span>
            </div>
            <Progress
              value={(data.critical / total) * 100}
              className="h-2 bg-gray-100"
              indicatorClassName="bg-red-500"
            />
          </div>
        </div>

        {data.surplus > 0 && (
          <div className="pt-2">
            <Link href="/surplus/manage" className="text-sm text-primary hover:underline flex items-center">
              <Droplets className="h-3.5 w-3.5 mr-1" />
              View surplus inventory
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="relative">
        <CardTitle className="text-lg">Inventory Status</CardTitle>
        <CardDescription>Summary of your blood inventory levels</CardDescription>
        {loading && (
          <div className="absolute top-4 right-4">
            <div className="animate-pulse h-2 w-2 rounded-full bg-blue-500"></div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error && <div className="p-3 text-sm border rounded-lg bg-red-50 text-red-700 mb-4">{error}</div>}

        <Tabs defaultValue="redBlood">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="redBlood">Red Blood</TabsTrigger>
            <TabsTrigger value="plasma">Plasma</TabsTrigger>
            <TabsTrigger value="platelets">Platelets</TabsTrigger>
          </TabsList>

          <TabsContent value="redBlood">{renderInventoryStatus("redBlood")}</TabsContent>

          <TabsContent value="plasma">{renderInventoryStatus("plasma")}</TabsContent>

          <TabsContent value="platelets">{renderInventoryStatus("platelets")}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
