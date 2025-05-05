"use client"

import { useEffect, useState } from "react"
import { formatBloodType, getBloodTypeColor, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type TransferHistoryItem = {
  transfer_id: number
  from_hospital_id: number
  to_hospital_id: number
  from_hospital_name: string
  to_hospital_name: string
  type: string
  blood_type: string
  rh: string
  amount: number
  units: number
  transfer_date: string
}

type SurplusTransferHistoryProps = {
  initialHistory: TransferHistoryItem[]
  hospitalId: number
  refreshInterval?: number
  className?: string
  limit?: number
}

export default function SurplusTransferHistory({
  initialHistory,
  hospitalId,
  refreshInterval = 60000, // Default to 1 minute
  className = "",
  limit = 5,
}: SurplusTransferHistoryProps) {
  const [history, setHistory] = useState<TransferHistoryItem[]>(initialHistory)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/surplus/history?hospitalId=${hospitalId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch transfer history")
        }

        const data = await response.json()
        setHistory(data)
      } catch (err) {
        console.error("Error fetching transfer history:", err)
        setError("Failed to refresh transfer history")
      } finally {
        setLoading(false)
      }
    }

    // Set up interval for periodic updates
    const intervalId = setInterval(fetchHistory, refreshInterval)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [hospitalId, refreshInterval])

  // Limit the number of history items to display
  const displayHistory = limit ? history.slice(0, limit) : history

  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Transfer History</CardTitle>
          <CardDescription>Recent blood component transfers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4 text-muted-foreground">
            No transfer history available.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="relative">
        <CardTitle className="text-lg">Transfer History</CardTitle>
        <CardDescription>Recent blood component transfers</CardDescription>
        {loading && (
          <div className="absolute top-4 right-4">
            <div className="animate-pulse h-2 w-2 rounded-full bg-blue-500"></div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error && <div className="p-3 text-sm border rounded-lg bg-red-50 text-red-700 mb-4">{error}</div>}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>From/To</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayHistory.map((item) => (
              <TableRow key={item.transfer_id}>
                <TableCell className="font-medium">{formatDate(new Date(item.transfer_date))}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                      {formatBloodType(item.blood_type, item.rh)}
                    </Badge>
                    <span className="text-xs">{item.type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {item.from_hospital_id === hospitalId ? (
                      <>
                        <span className="text-xs">To: {item.to_hospital_name}</span>
                        <ArrowLeftRight className="h-3 w-3 text-blue-500" />
                      </>
                    ) : (
                      <>
                        <span className="text-xs">From: {item.from_hospital_name}</span>
                        <ArrowLeftRight className="h-3 w-3 text-green-500" />
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {item.units} units
                    <div className="text-xs text-muted-foreground">{item.amount} ml</div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {history.length > limit && (
          <div className="text-center mt-4">
            <a href="/surplus/history" className="text-sm text-primary hover:underline">
              View all {history.length} transfers
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
