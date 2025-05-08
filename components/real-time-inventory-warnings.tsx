"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Droplet, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataLoading } from "@/components/data-loading"
import { DataFetchError } from "@/components/data-fetch-error"

// Define types for inventory data
type InventoryItem = {
  blood_type: string
  rh?: string
  count: number
  total_amount: number
}

// Define thresholds for warnings
const CRITICAL_THRESHOLD = 3
const LOW_THRESHOLD = 5

interface RealTimeInventoryWarningsProps {
  initialRedBlood: InventoryItem[]
  initialPlasma: InventoryItem[]
  initialPlatelets: InventoryItem[]
  hospitalId: number
  refreshInterval?: number
  className?: string
}

export default function RealTimeInventoryWarnings({
  initialRedBlood = [],
  initialPlasma = [],
  initialPlatelets = [],
  hospitalId,
  refreshInterval = 30000, // Default to 30 seconds
  className = "",
}: RealTimeInventoryWarningsProps) {
  // Ensure we always have arrays, even if undefined is passed
  const safeInitialRedBlood = Array.isArray(initialRedBlood) ? initialRedBlood : []
  const safeInitialPlasma = Array.isArray(initialPlasma) ? initialPlasma : []
  const safeInitialPlatelets = Array.isArray(initialPlatelets) ? initialPlatelets : []

  const [redBlood, setRedBlood] = useState<InventoryItem[]>(safeInitialRedBlood)
  const [plasma, setPlasma] = useState<InventoryItem[]>(safeInitialPlasma)
  const [platelets, setPlatelets] = useState<InventoryItem[]>(safeInitialPlatelets)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Function to fetch fresh data
  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch red blood cell data
      const redBloodResponse = await fetch(`/api/inventory/redblood?hospitalId=${hospitalId}`)
      if (!redBloodResponse.ok) throw new Error("Failed to fetch red blood cell data")
      const redBloodData = await redBloodResponse.json()

      // Fetch plasma data
      const plasmaResponse = await fetch(`/api/inventory/plasma?hospitalId=${hospitalId}`)
      if (!plasmaResponse.ok) throw new Error("Failed to fetch plasma data")
      const plasmaData = await plasmaResponse.json()

      // Fetch platelets data
      const plateletsResponse = await fetch(`/api/inventory/platelets?hospitalId=${hospitalId}`)
      if (!plateletsResponse.ok) throw new Error("Failed to fetch platelets data")
      const plateletsData = await plateletsResponse.json()

      // Update state with fresh data - ensure we have arrays
      setRedBlood(Array.isArray(redBloodData) ? redBloodData : [])
      setPlasma(Array.isArray(plasmaData) ? plasmaData : [])
      setPlatelets(Array.isArray(plateletsData) ? plateletsData : [])
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error fetching inventory data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch inventory data")
    } finally {
      setLoading(false)
    }
  }

  // Set up interval to refresh data
  useEffect(() => {
    // Initial fetch after component mounts
    const timer = setTimeout(() => {
      fetchData()
    }, 1000) // Small initial delay

    // Set up interval for subsequent fetches
    const interval = setInterval(fetchData, refreshInterval)

    // Clean up on unmount
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [hospitalId, refreshInterval])

  // Function to get all warnings
  const getWarnings = () => {
    const warnings: {
      type: string
      bloodType: string
      rh: string
      count: number
      severity: "critical" | "low"
    }[] = []

    // Check red blood cell inventory - ensure we're working with arrays
    if (Array.isArray(redBlood)) {
      redBlood.forEach((item) => {
        if (item && typeof item.count === "number") {
          if (item.count <= CRITICAL_THRESHOLD) {
            warnings.push({
              type: "Red Blood Cells",
              bloodType: item.blood_type || "Unknown",
              rh: item.rh || "",
              count: item.count,
              severity: "critical",
            })
          } else if (item.count <= LOW_THRESHOLD) {
            warnings.push({
              type: "Red Blood Cells",
              bloodType: item.blood_type || "Unknown",
              rh: item.rh || "",
              count: item.count,
              severity: "low",
            })
          }
        }
      })
    }

    // Check plasma inventory - ensure we're working with arrays
    if (Array.isArray(plasma)) {
      plasma.forEach((item) => {
        if (item && typeof item.count === "number") {
          if (item.count <= CRITICAL_THRESHOLD) {
            warnings.push({
              type: "Plasma",
              bloodType: item.blood_type || "Unknown",
              rh: "",
              count: item.count,
              severity: "critical",
            })
          } else if (item.count <= LOW_THRESHOLD) {
            warnings.push({
              type: "Plasma",
              bloodType: item.blood_type || "Unknown",
              rh: "",
              count: item.count,
              severity: "low",
            })
          }
        }
      })
    }

    // Check platelets inventory - ensure we're working with arrays
    if (Array.isArray(platelets)) {
      platelets.forEach((item) => {
        if (item && typeof item.count === "number") {
          if (item.count <= CRITICAL_THRESHOLD) {
            warnings.push({
              type: "Platelets",
              bloodType: item.blood_type || "Unknown",
              rh: item.rh || "",
              count: item.count,
              severity: "critical",
            })
          } else if (item.count <= LOW_THRESHOLD) {
            warnings.push({
              type: "Platelets",
              bloodType: item.blood_type || "Unknown",
              rh: item.rh || "",
              count: item.count,
              severity: "low",
            })
          }
        }
      })
    }

    return warnings
  }

  const warnings = getWarnings()
  const hasCriticalWarnings = warnings.some((w) => w.severity === "critical")

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            Inventory Warnings
          </CardTitle>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="h-8 px-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</div>
      </CardHeader>

      <CardContent>
        {loading && warnings.length === 0 ? (
          <DataLoading message="Refreshing inventory data..." size="sm" />
        ) : error ? (
          <DataFetchError message="Failed to refresh inventory data" details={error} onRetry={fetchData} />
        ) : warnings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <Droplet className="h-8 w-8 mb-2 text-green-500" />
            <p>All inventory levels are sufficient</p>
            <p className="text-xs mt-1">No warnings to display</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hasCriticalWarnings && (
              <Alert variant="destructive" className="mb-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Critical Inventory Levels</AlertTitle>
                <AlertDescription>
                  Some blood products are at critically low levels and require immediate attention.
                </AlertDescription>
              </Alert>
            )}

            {warnings.map((warning, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-md ${
                  warning.severity === "critical"
                    ? "bg-red-50 border border-red-200"
                    : "bg-amber-50 border border-amber-200"
                }`}
              >
                <div>
                  <div className="font-medium flex items-center">
                    {warning.type}{" "}
                    <Badge variant={warning.severity === "critical" ? "destructive" : "outline"} className="ml-2">
                      {warning.severity === "critical" ? "CRITICAL" : "LOW"}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    {warning.bloodType}
                    {warning.rh && ` ${warning.rh}`}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xl font-bold ${warning.severity === "critical" ? "text-red-600" : "text-amber-600"}`}
                  >
                    {warning.count}
                  </div>
                  <div className="text-xs text-muted-foreground">units</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
