"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import RunMigrationButton from "./run-migration-button"

type SurplusTransferHistoryProps = {
  initialHistory: any[]
  hospitalId: number
  refreshInterval?: number
  limit?: number
  className?: string
}

export default function SurplusTransferHistory({
  initialHistory,
  hospitalId,
  refreshInterval = 60000,
  limit = 10,
  className = "",
}: SurplusTransferHistoryProps) {
  const [history, setHistory] = useState<any[]>(initialHistory || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Function to fetch the latest data
  const refreshData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/surplus/history?hospitalId=${hospitalId}`)

      if (!response.ok) {
        throw new Error(`Error fetching transfer history: ${response.status}`)
      }

      const data = await response.json()
      setHistory(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Failed to fetch transfer history:", err)
      setError("Failed to load transfer history. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Set up auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(refreshData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, hospitalId])

  // Format the date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return "Invalid date"
    }
  }

  // Get the type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "RedBlood":
        return "bg-red-100 text-red-800"
      case "Plasma":
        return "bg-yellow-100 text-yellow-800"
      case "Platelets":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Check if the table exists
  const tableDoesNotExist = history.length === 0 && error === null && initialHistory && initialHistory.length === 0

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Transfer History</CardTitle>
            <CardDescription>Recent blood product transfers involving your hospital</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tableDoesNotExist ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Transfer History Not Available</h3>
            <p className="text-gray-500 max-w-md mb-4">
              The transfer history feature is not set up yet. Please run the database migration to create the necessary
              tables.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-left w-full mb-4">
              <p className="text-sm text-yellow-800 font-mono">Error: relation "surplus_transfers" does not exist</p>
            </div>
            <RunMigrationButton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to Load Transfer History</h3>
            <p className="text-gray-500">{error}</p>
            <Button variant="outline" onClick={refreshData} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No transfer history available yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              When you transfer blood products to or from other hospitals, the records will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.slice(0, limit).map((transfer) => (
                    <TableRow key={transfer.transfer_id}>
                      <TableCell>
                        <Badge className={getTypeBadgeColor(transfer.type)} variant="outline">
                          {transfer.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transfer.from_hospital_id === hospitalId ? "Your Hospital" : transfer.from_hospital_name}
                      </TableCell>
                      <TableCell>
                        {transfer.to_hospital_id === hospitalId ? "Your Hospital" : transfer.to_hospital_name}
                      </TableCell>
                      <TableCell>
                        {transfer.blood_type}
                        {transfer.rh ? ` ${transfer.rh}` : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        {transfer.amount} ml ({transfer.units} units)
                      </TableCell>
                      <TableCell className="text-right text-gray-500 text-sm">
                        {formatDate(transfer.transfer_date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {history.length > limit && (
              <div className="mt-4 text-center">
                <Button variant="link" asChild>
                  <a href="/surplus/history">View All Transfer History</a>
                </Button>
              </div>
            )}
            <div className="text-xs text-gray-400 mt-4 text-right">
              Last updated: {formatDate(lastUpdated.toISOString())}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
