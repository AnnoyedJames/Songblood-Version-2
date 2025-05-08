"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { DataLoading } from "@/components/data-loading"
import { DataFetchError } from "@/components/data-fetch-error"

// Define types for inventory data
type InventoryItem = {
  blood_type: string
  rh?: string
  count: number
  total_amount: number
}

interface InventoryTableProps {
  title: string
  inventory: InventoryItem[]
  showRh?: boolean
  className?: string
}

export default function InventoryTable({ title, inventory = [], showRh = false, className = "" }: InventoryTableProps) {
  // Ensure inventory is always an array
  const safeInventory = Array.isArray(inventory) ? inventory : []

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

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

  // Calculate totals safely
  const totalUnits = safeInventory.reduce((sum, item) => sum + Number(item?.count || 0), 0)
  const totalAmount = safeInventory.reduce((sum, item) => sum + Number(item?.total_amount || 0), 0)

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={refreshData} disabled={loading} className="h-8 px-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <DataLoading message="Refreshing inventory data..." size="sm" />
        ) : error ? (
          <DataFetchError message="Failed to refresh inventory data" details={error} onRetry={refreshData} />
        ) : safeInventory.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No inventory data available</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blood Type</TableHead>
                {showRh && <TableHead>Rh</TableHead>}
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Volume (ml)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeInventory.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item?.blood_type || "Unknown"}</TableCell>
                  {showRh && <TableCell>{item?.rh || ""}</TableCell>}
                  <TableCell className="text-right">{item?.count || 0}</TableCell>
                  <TableCell className="text-right">{(item?.total_amount || 0).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-medium">
                <TableCell>Total</TableCell>
                {showRh && <TableCell></TableCell>}
                <TableCell className="text-right">{totalUnits}</TableCell>
                <TableCell className="text-right">{totalAmount.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
