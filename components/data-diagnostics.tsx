"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function DataDiagnostics() {
  const [diagnosticData, setDiagnosticData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/diagnostics/redblood?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setDiagnosticData(data.data)
      } else {
        setError(data.error || "Unknown error occurred")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run diagnostics")
      console.error("Diagnostics error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!diagnosticData) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Red Blood Cell Data Diagnostics</CardTitle>
        <CardDescription>
          Analyzing data discrepancies in red blood cell inventory
          <div className="mt-2">
            <Button size="sm" onClick={runDiagnostics} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm text-muted-foreground">Total Records</div>
                <div className="text-2xl font-bold">{diagnosticData.totalCounts?.total_count || 0}</div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm text-muted-foreground">Total Amount</div>
                <div className="text-2xl font-bold">{diagnosticData.totalCounts?.total_amount || 0} ml</div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm text-muted-foreground">Valid Records</div>
                <div className="text-2xl font-bold">{diagnosticData.totalCounts?.valid_count || 0}</div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm text-muted-foreground">Valid Amount</div>
                <div className="text-2xl font-bold">{diagnosticData.totalCounts?.valid_amount || 0} ml</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Current date: {new Date(diagnosticData.currentDate).toLocaleString()}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Aggregated Data (Non-Expired)</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Rh Factor</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Total Amount (ml)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnosticData.aggregatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    diagnosticData.aggregatedData.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.blood_type}</TableCell>
                        <TableCell>{item.rh}</TableCell>
                        <TableCell className="text-right">{Number(item.count).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{Number(item.total_amount).toLocaleString()} ml</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Expired Data</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Rh Factor</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Total Amount (ml)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnosticData.expiredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No expired data
                      </TableCell>
                    </TableRow>
                  ) : (
                    diagnosticData.expiredData.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.blood_type}</TableCell>
                        <TableCell>{item.rh}</TableCell>
                        <TableCell className="text-right">{Number(item.count).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{Number(item.total_amount).toLocaleString()} ml</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Sample Raw Data (First 10 Records)</h3>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bag ID</TableHead>
                    <TableHead>Donor Name</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Rh</TableHead>
                    <TableHead className="text-right">Amount (ml)</TableHead>
                    <TableHead>Expiration Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnosticData.rawInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No raw data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    diagnosticData.rawInventory.map((item: any) => {
                      const expirationDate = new Date(item.expiration_date)
                      const isExpired = expirationDate < new Date(diagnosticData.currentDate)

                      return (
                        <TableRow key={item.bag_id}>
                          <TableCell>{item.bag_id}</TableCell>
                          <TableCell>{item.donor_name}</TableCell>
                          <TableCell>{item.blood_type}</TableCell>
                          <TableCell>{item.rh}</TableCell>
                          <TableCell className="text-right">{Number(item.amount).toLocaleString()} ml</TableCell>
                          <TableCell>{new Date(item.expiration_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${isExpired ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                            >
                              {isExpired ? "Expired" : "Valid"}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
