"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Filter, X, Pencil, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { ConfirmationDialog } from "./confirmation-dialog"
import { EditEntryDialog } from "./edit-entry-dialog"

type DiagnosticFilters = {
  showAllHospitals: boolean
  bloodType: string | null
  rhFactor: string | null
  expirationStatus: "all" | "valid" | "expired"
}

export default function DataDiagnostics() {
  const [diagnosticData, setDiagnosticData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("summary")

  // Filter state
  const [filters, setFilters] = useState<DiagnosticFilters>({
    showAllHospitals: false,
    bloodType: null,
    rhFactor: null,
    expirationStatus: "valid",
  })

  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Function to build query string from filters
  const buildQueryString = (filters: DiagnosticFilters) => {
    const params = new URLSearchParams()

    if (filters.showAllHospitals) {
      params.append("showAllHospitals", "true")
    }

    if (filters.bloodType) {
      params.append("bloodType", filters.bloodType)
    }

    if (filters.rhFactor) {
      params.append("rhFactor", filters.rhFactor)
    }

    params.append("expirationStatus", filters.expirationStatus)

    return params.toString()
  }

  const runDiagnostics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const queryString = buildQueryString(filters)
      const response = await fetch(`/api/diagnostics/redblood?${queryString}&t=${Date.now()}`, {
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
        console.log("Diagnostic data received:", data.data)
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

  // Run diagnostics when filters change
  useEffect(() => {
    runDiagnostics()
  }, [filters])

  // Reset filters to default
  const resetFilters = () => {
    setFilters({
      showAllHospitals: false,
      bloodType: null,
      rhFactor: null,
      expirationStatus: "valid",
    })
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof DiagnosticFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleEditEntry = (entry: any) => {
    setSelectedEntry(entry)
    setIsEditDialogOpen(true)
  }

  const handleDeleteEntry = async (bagId: number, entryType: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/diagnostics/delete-entry`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bagId, entryType }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful deletion
        runDiagnostics()
      } else {
        setError(data.error || "Failed to delete entry")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry")
      console.error("Delete entry error:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveEntry = async (updatedEntry: any) => {
    try {
      const response = await fetch(`/api/diagnostics/update-entry`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedEntry),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful update
        runDiagnostics()
        return { success: true }
      } else {
        return { success: false, message: data.error || "Failed to update entry" }
      }
    } catch (err) {
      console.error("Update entry error:", err)
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to update entry",
      }
    }
  }

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

  // Count active filters
  const activeFilterCount = [
    filters.showAllHospitals,
    filters.bloodType,
    filters.rhFactor,
    filters.expirationStatus !== "valid",
  ].filter(Boolean).length

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle>Red Blood Cell Data Diagnostics</CardTitle>
            <CardDescription>Analyzing data discrepancies in red blood cell inventory</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={runDiagnostics} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Section */}
        <div className="mb-6 border rounded-md p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount} active
                </Badge>
              )}
            </h3>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8">
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Hospital Filter */}
            <div>
              <Label htmlFor="hospital-filter" className="mb-1 block">
                Hospital
              </Label>
              <Select
                value={filters.showAllHospitals ? "all" : "current"}
                onValueChange={(value) => handleFilterChange("showAllHospitals", value === "all")}
              >
                <SelectTrigger id="hospital-filter">
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Hospital Only</SelectItem>
                  <SelectItem value="all">All Hospitals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Blood Type Filter */}
            <div>
              <Label htmlFor="blood-type-filter" className="mb-1 block">
                Blood Type
              </Label>
              <Select
                value={filters.bloodType || "all"}
                onValueChange={(value) => handleFilterChange("bloodType", value === "all" ? null : value)}
              >
                <SelectTrigger id="blood-type-filter">
                  <SelectValue placeholder="All Blood Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Blood Types</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="AB">AB</SelectItem>
                  <SelectItem value="O">O</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rh Factor Filter */}
            <div>
              <Label htmlFor="rh-factor-filter" className="mb-1 block">
                Rh Factor
              </Label>
              <Select
                value={filters.rhFactor || "all"}
                onValueChange={(value) => handleFilterChange("rhFactor", value === "all" ? null : value)}
              >
                <SelectTrigger id="rh-factor-filter">
                  <SelectValue placeholder="All Rh Factors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rh Factors</SelectItem>
                  <SelectItem value="+">Positive (+)</SelectItem>
                  <SelectItem value="-">Negative (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expiration Status Filter */}
            <div>
              <Label htmlFor="expiration-filter" className="mb-1 block">
                Expiration Status
              </Label>
              <Select
                value={filters.expirationStatus}
                onValueChange={(value) => handleFilterChange("expirationStatus", value as "all" | "valid" | "expired")}
              >
                <SelectTrigger id="expiration-filter">
                  <SelectValue placeholder="Select expiration status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Blood</SelectItem>
                  <SelectItem value="valid">Non-Expired Only</SelectItem>
                  <SelectItem value="expired">Expired Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Applied Filters Summary */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {diagnosticData.totalCounts?.total_count || 0} records
            {filters.showAllHospitals ? " across all hospitals" : " from your hospital"}
            {filters.bloodType ? `, blood type ${filters.bloodType}` : ""}
            {filters.rhFactor ? `, Rh ${filters.rhFactor}` : ""}
            {filters.expirationStatus === "valid"
              ? ", non-expired only"
              : filters.expirationStatus === "expired"
                ? ", expired only"
                : ""}
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="aggregated">Aggregated Data</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
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

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Aggregated Data (Non-Expired)</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Blood Type</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Total Amount (ml)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!diagnosticData.aggregatedData || diagnosticData.aggregatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        diagnosticData.aggregatedData.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                                {formatBloodType(item.blood_type, item.rh)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{Number(item.count).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              {Number(item.total_amount).toLocaleString()} ml
                            </TableCell>
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
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Total Amount (ml)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!diagnosticData.expiredData || diagnosticData.expiredData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No expired data
                          </TableCell>
                        </TableRow>
                      ) : (
                        diagnosticData.expiredData.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                                {formatBloodType(item.blood_type, item.rh)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{Number(item.count).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              {Number(item.total_amount).toLocaleString()} ml
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aggregated Data Tab */}
          <TabsContent value="aggregated">
            <div className="space-y-6">
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
                        <TableHead className="text-right">Average (ml)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!diagnosticData.aggregatedData || diagnosticData.aggregatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        diagnosticData.aggregatedData.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.blood_type}</TableCell>
                            <TableCell>{item.rh}</TableCell>
                            <TableCell className="text-right">{Number(item.count).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              {Number(item.total_amount).toLocaleString()} ml
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(item.count) > 0 ? (Number(item.total_amount) / Number(item.count)).toFixed(0) : 0}{" "}
                              ml
                            </TableCell>
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
                        <TableHead className="text-right">Average (ml)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!diagnosticData.expiredData || diagnosticData.expiredData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No expired data
                          </TableCell>
                        </TableRow>
                      ) : (
                        diagnosticData.expiredData.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.blood_type}</TableCell>
                            <TableCell>{item.rh}</TableCell>
                            <TableCell className="text-right">{Number(item.count).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              {Number(item.total_amount).toLocaleString()} ml
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(item.count) > 0 ? (Number(item.total_amount) / Number(item.count)).toFixed(0) : 0}{" "}
                              ml
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Raw Data Tab */}
          <TabsContent value="raw">
            <div>
              <h3 className="text-lg font-medium mb-2">Raw Data Records</h3>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bag ID</TableHead>
                      <TableHead>Donor Name</TableHead>
                      <TableHead>Blood Type</TableHead>
                      <TableHead>Amount (ml)</TableHead>
                      <TableHead>Expiration Date</TableHead>
                      {filters.showAllHospitals && <TableHead>Hospital</TableHead>}
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!diagnosticData.rawInventory || diagnosticData.rawInventory.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={filters.showAllHospitals ? 7 : 6}
                          className="text-center text-muted-foreground"
                        >
                          No raw data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      diagnosticData.rawInventory.map((item: any) => {
                        const expirationDate = new Date(item.expiration_date)
                        const isExpired = expirationDate < new Date(diagnosticData.currentDate)
                        const canEdit = !filters.showAllHospitals || (filters.showAllHospitals && item.is_own_hospital)

                        return (
                          <TableRow key={item.bag_id}>
                            <TableCell>{item.bag_id}</TableCell>
                            <TableCell>{item.donor_name}</TableCell>
                            <TableCell>
                              <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                                {formatBloodType(item.blood_type, item.rh)}
                              </Badge>
                            </TableCell>
                            <TableCell>{Number(item.amount).toLocaleString()} ml</TableCell>
                            <TableCell>{new Date(item.expiration_date).toLocaleDateString()}</TableCell>
                            {filters.showAllHospitals && <TableCell>{item.hospital_name}</TableCell>}
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${isExpired ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                              >
                                {isExpired ? "Expired" : "Valid"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {canEdit && (
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditEntry(item)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <ConfirmationDialog
                                    title="Delete Blood Entry"
                                    description={`Are you sure you want to delete the ${item.type} bag #${item.bag_id}? This action cannot be undone.`}
                                    actionLabel="Delete"
                                    onConfirm={() => handleDeleteEntry(item.bag_id, item.type)}
                                    trigger={
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                      </Button>
                                    }
                                  />
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {diagnosticData.rawInventory && diagnosticData.rawInventory.length > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Showing {diagnosticData.rawInventory.length} records.{" "}
                  {diagnosticData.totalCounts?.total_count > diagnosticData.rawInventory.length &&
                    `There are ${diagnosticData.totalCounts?.total_count - diagnosticData.rawInventory.length} more records not shown.`}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      {selectedEntry && (
        <EditEntryDialog
          entry={selectedEntry}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveEntry}
        />
      )}
    </Card>
  )
}
