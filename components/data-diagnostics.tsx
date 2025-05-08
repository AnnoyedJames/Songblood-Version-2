"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { EditEntryDialog } from "./edit-entry-dialog"
import { ConfirmationDialog } from "./confirmation-dialog"
import { AlertCircle, CheckCircle2, RefreshCw, Trash2, Undo2 } from "lucide-react"

type BloodEntry = {
  bag_id: number
  donor_name: string
  blood_type: string
  rh: string
  amount: number
  expiration_date: string
  hospital_name: string
  type: "RedBlood" | "Plasma" | "Platelets"
}

type DeletedEntry = BloodEntry & {
  deleted_at: string
}

export default function DataDiagnostics() {
  // State for inventory data
  const [redBloodData, setRedBloodData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for filters
  const [filters, setFilters] = useState({
    bloodType: "",
    rhFactor: "",
    expirationStatus: "valid",
    showAllHospitals: false,
    donorName: "",
    minAmount: "",
    maxAmount: "",
  })

  // State for edit dialog
  const [selectedEntry, setSelectedEntry] = useState<BloodEntry | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // State for delete confirmation
  const [entryToDelete, setEntryToDelete] = useState<BloodEntry | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // State for deleted entries
  const [deletedEntries, setDeletedEntries] = useState<DeletedEntry[]>([])
  const [isShowingDeleted, setIsShowingDeleted] = useState(false)

  // State for action messages
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Load inventory data
  const fetchInventoryData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      if (filters.bloodType) params.append("bloodType", filters.bloodType)
      if (filters.rhFactor) params.append("rhFactor", filters.rhFactor)
      if (filters.expirationStatus) params.append("expirationStatus", filters.expirationStatus)
      if (filters.showAllHospitals) params.append("showAllHospitals", "true")
      if (filters.donorName) params.append("donorName", filters.donorName)
      if (filters.minAmount) params.append("minAmount", filters.minAmount)
      if (filters.maxAmount) params.append("maxAmount", filters.maxAmount)

      const response = await fetch(`/api/diagnostics/redblood?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch inventory data")
      }

      const data = await response.json()
      setRedBloodData(data.data)
    } catch (err) {
      console.error("Error fetching inventory data:", err)
      setError("Failed to load inventory data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Load deleted entries
  const fetchDeletedEntries = async () => {
    try {
      const response = await fetch("/api/diagnostics/deleted-entries")

      if (!response.ok) {
        throw new Error("Failed to fetch deleted entries")
      }

      const data = await response.json()
      setDeletedEntries(data.entries || [])
    } catch (err) {
      console.error("Error fetching deleted entries:", err)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchInventoryData()
    fetchDeletedEntries()
  }, [])

  // Refresh data when filters change
  useEffect(() => {
    fetchInventoryData()
  }, [filters])

  // Handle filter changes
  const handleFilterChange = (name: string, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  // Handle edit entry
  const handleEditEntry = (entry: BloodEntry) => {
    setSelectedEntry(entry)
    setIsEditDialogOpen(true)
  }

  // Handle save entry
  const handleSaveEntry = async (updatedEntry: BloodEntry) => {
    try {
      const response = await fetch("/api/diagnostics/update-entry", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedEntry),
      })

      const result = await response.json()

      if (result.success) {
        setActionMessage({ type: "success", text: "Entry updated successfully" })
        fetchInventoryData() // Refresh data
        return { success: true }
      } else {
        setActionMessage({ type: "error", text: result.error || "Failed to update entry" })
        return { success: false, message: result.error }
      }
    } catch (err) {
      console.error("Error updating entry:", err)
      setActionMessage({ type: "error", text: "An unexpected error occurred" })
      return { success: false, message: "An unexpected error occurred" }
    }
  }

  // Handle delete entry
  const handleDeleteEntry = (entry: BloodEntry) => {
    setEntryToDelete(entry)
    setIsDeleteDialogOpen(true)
  }

  // Confirm delete entry
  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return

    try {
      const response = await fetch("/api/diagnostics/delete-entry", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bagId: entryToDelete.bag_id,
          entryType: entryToDelete.type,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setActionMessage({ type: "success", text: "Entry deleted successfully" })
        fetchInventoryData() // Refresh data
        fetchDeletedEntries() // Refresh deleted entries
      } else {
        setActionMessage({ type: "error", text: result.error || "Failed to delete entry" })
      }
    } catch (err) {
      console.error("Error deleting entry:", err)
      setActionMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  // Handle restore entry
  const handleRestoreEntry = async (entry: DeletedEntry) => {
    try {
      const response = await fetch("/api/diagnostics/restore-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bagId: entry.bag_id,
          entryType: entry.type,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setActionMessage({ type: "success", text: "Entry restored successfully" })
        fetchInventoryData() // Refresh data
        fetchDeletedEntries() // Refresh deleted entries
      } else {
        setActionMessage({ type: "error", text: result.error || "Failed to restore entry" })
      }
    } catch (err) {
      console.error("Error restoring entry:", err)
      setActionMessage({ type: "error", text: "An unexpected error occurred" })
    }
  }

  // Clear action message after 5 seconds
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => {
        setActionMessage(null)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [actionMessage])

  return (
    <div className="space-y-6">
      {/* Action Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-md ${
            actionMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          } flex items-center justify-between`}
        >
          <div className="flex items-center">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Blood Inventory Management</CardTitle>
          <CardDescription>View, edit, and manage your blood inventory data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active" onClick={() => setIsShowingDeleted(false)}>
                Active Inventory
              </TabsTrigger>
              <TabsTrigger
                value="deleted"
                onClick={() => {
                  setIsShowingDeleted(true)
                  fetchDeletedEntries()
                }}
              >
                Deleted Entries
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {/* Filters */}
              <div className="bg-slate-50 p-4 rounded-md mb-6">
                <h3 className="font-medium mb-3">Advanced Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Select value={filters.bloodType} onValueChange={(value) => handleFilterChange("bloodType", value)}>
                      <SelectTrigger id="bloodType">
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

                  <div>
                    <Label htmlFor="rhFactor">Rh Factor</Label>
                    <Select value={filters.rhFactor} onValueChange={(value) => handleFilterChange("rhFactor", value)}>
                      <SelectTrigger id="rhFactor">
                        <SelectValue placeholder="All Rh Factors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rh Factors</SelectItem>
                        <SelectItem value="+">Positive (+)</SelectItem>
                        <SelectItem value="-">Negative (-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expirationStatus">Expiration Status</Label>
                    <Select
                      value={filters.expirationStatus}
                      onValueChange={(value) => handleFilterChange("expirationStatus", value)}
                    >
                      <SelectTrigger id="expirationStatus">
                        <SelectValue placeholder="Expiration Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="valid">Valid</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="donorName">Donor Name</Label>
                    <div className="flex">
                      <Input
                        id="donorName"
                        value={filters.donorName}
                        onChange={(e) => handleFilterChange("donorName", e.target.value)}
                        placeholder="Search by donor name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="amountRange">Amount Range (ml)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="minAmount"
                        value={filters.minAmount}
                        onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                        placeholder="Min"
                        type="number"
                      />
                      <Input
                        id="maxAmount"
                        value={filters.maxAmount}
                        onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                        placeholder="Max"
                        type="number"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showAllHospitals"
                        checked={filters.showAllHospitals}
                        onCheckedChange={(checked) => handleFilterChange("showAllHospitals", checked === true)}
                      />
                      <Label htmlFor="showAllHospitals">Show all hospitals</Label>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        bloodType: "",
                        rhFactor: "",
                        expirationStatus: "valid",
                        showAllHospitals: false,
                        donorName: "",
                        minAmount: "",
                        maxAmount: "",
                      })
                    }}
                    className="mr-2"
                  >
                    Reset Filters
                  </Button>
                  <Button onClick={fetchInventoryData} className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </div>

              {/* Inventory Table */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                  <p className="mt-2">Loading inventory data...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-800 p-4 rounded-md">
                  <p className="font-medium">Error</p>
                  <p>{error}</p>
                </div>
              ) : redBloodData?.rawInventory?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No inventory data found matching your filters.</p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">
                      Showing {redBloodData?.rawInventory?.length || 0} entries
                      {redBloodData?.totalCounts && <span> of {redBloodData.totalCounts.total_count} total</span>}
                    </p>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bag ID</TableHead>
                          <TableHead>Blood Type</TableHead>
                          <TableHead>Donor</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Expiration</TableHead>
                          <TableHead>Hospital</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {redBloodData?.rawInventory?.map((entry: any) => {
                          const isExpired = new Date(entry.expiration_date) <= new Date()

                          return (
                            <TableRow key={entry.bag_id}>
                              <TableCell>{entry.bag_id}</TableCell>
                              <TableCell>
                                <Badge className={getBloodTypeColor(entry.blood_type, entry.rh)}>
                                  {formatBloodType(entry.blood_type, entry.rh)}
                                </Badge>
                              </TableCell>
                              <TableCell>{entry.donor_name}</TableCell>
                              <TableCell>{entry.amount} ml</TableCell>
                              <TableCell>
                                <span className={isExpired ? "text-red-600" : ""}>
                                  {new Date(entry.expiration_date).toLocaleDateString()}
                                  {isExpired && " (Expired)"}
                                </span>
                              </TableCell>
                              <TableCell>{entry.hospital_name}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleEditEntry({
                                      ...entry,
                                      type: "RedBlood",
                                    })
                                  }
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800 hover:bg-red-100"
                                  onClick={() =>
                                    handleDeleteEntry({
                                      ...entry,
                                      type: "RedBlood",
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="deleted">
              {/* Deleted Entries Table */}
              {isShowingDeleted && (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="font-medium">Deleted Entries</h3>
                    <Button variant="outline" size="sm" onClick={fetchDeletedEntries}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  {deletedEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No deleted entries found.</p>
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bag ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Blood Type</TableHead>
                            <TableHead>Donor</TableHead>
                            <TableHead>Deleted At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deletedEntries.map((entry) => (
                            <TableRow key={`${entry.type}-${entry.bag_id}`}>
                              <TableCell>{entry.bag_id}</TableCell>
                              <TableCell>{entry.type}</TableCell>
                              <TableCell>
                                <Badge className={getBloodTypeColor(entry.blood_type, entry.rh)}>
                                  {formatBloodType(entry.blood_type, entry.rh)}
                                </Badge>
                              </TableCell>
                              <TableCell>{entry.donor_name}</TableCell>
                              <TableCell>{new Date(entry.deleted_at).toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-800 hover:bg-green-100"
                                  onClick={() => handleRestoreEntry(entry)}
                                >
                                  <Undo2 className="h-4 w-4 mr-1" />
                                  Restore
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditEntryDialog
        entry={selectedEntry}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEntry}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        title="Delete Entry"
        description={`Are you sure you want to delete bag #${entryToDelete?.bag_id}? This will soft-delete the entry and it can be restored later.`}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteEntry}
      />
    </div>
  )
}
