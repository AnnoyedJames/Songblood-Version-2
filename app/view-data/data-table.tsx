"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, RotateCcw, Search, Filter, X } from "lucide-react"
import ConfirmationDialog from "@/components/confirmation-dialog"
import EditEntryDialog from "@/components/edit-entry-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { formatBloodType } from "@/lib/utils"

type EntryType = {
  type: string
  bag_id: number
  donor_name: string
  blood_type: string
  rh: string
  amount: number
  expiration_date: string
  hospital_name: string
  hospital_id: number
  active: boolean
}

type DataTableProps = {
  showInactive: boolean
  hospitalId: number
}

export default function DataTable({ showInactive, hospitalId }: DataTableProps) {
  const [entries, setEntries] = useState<EntryType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [entryToDelete, setEntryToDelete] = useState<EntryType | null>(null)
  const [entryToRestore, setEntryToRestore] = useState<EntryType | null>(null)
  const [entryToEdit, setEntryToEdit] = useState<EntryType | null>(null)
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>("all")
  const [entryTypeFilter, setEntryTypeFilter] = useState<string>("all")
  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Use a default search term if none is provided
      const searchTerm = searchQuery.trim() || "a"

      // Add error handling for the fetch request
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchTerm)}&showInactive=${showInactive}`, {
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Search API error:", errorText)
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data || !Array.isArray(data.results)) {
        console.error("Invalid data format:", data)
        throw new Error("Invalid data format received from server")
      }

      setEntries(data.results)

      // Log success for debugging
      console.log(`Fetched ${data.results.length} entries for query "${searchTerm}" (showInactive: ${showInactive})`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("Error fetching data:", errorMessage)
      setError("Error fetching data: " + errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data: " + errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on initial load and when showInactive changes
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  const handleDelete = async (entry: EntryType) => {
    try {
      const response = await fetch("/api/donor/soft-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bagId: entry.bag_id,
          entryType: entry.type,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete entry")
      }

      toast({
        title: "Entry Deleted",
        description: `Entry for ${entry.donor_name} has been deleted.`,
      })

      // Refresh data
      fetchData()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete entry: " + (err instanceof Error ? err.message : String(err)),
      })
    }
  }

  const handleRestore = async (entry: EntryType) => {
    try {
      const response = await fetch("/api/donor/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bagId: entry.bag_id,
          entryType: entry.type,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to restore entry")
      }

      toast({
        title: "Entry Restored",
        description: `Entry for ${entry.donor_name} has been restored.`,
      })

      // Refresh data
      fetchData()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to restore entry: " + (err instanceof Error ? err.message : String(err)),
      })
    }
  }

  const handleUpdate = async (updatedEntry: any) => {
    try {
      const response = await fetch("/api/donor/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bagId: updatedEntry.bag_id,
          entryType: updatedEntry.type,
          donorName: updatedEntry.donor_name,
          bloodType: updatedEntry.blood_type,
          rh: updatedEntry.rh,
          amount: updatedEntry.amount,
          expirationDate: updatedEntry.expiration_date,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          message: errorData.error || "Failed to update entry",
        }
      }

      // Refresh data
      fetchData()
      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: "Failed to update entry: " + (err instanceof Error ? err.message : String(err)),
      }
    }
  }

  const confirmDelete = (entry: EntryType) => {
    setEntryToDelete(entry)
  }

  const confirmRestore = (entry: EntryType) => {
    setEntryToRestore(entry)
  }

  const openEditDialog = (entry: EntryType) => {
    setEntryToEdit(entry)
  }

  const filteredEntries = entries.filter((entry) => {
    // Apply blood type filter
    if (bloodTypeFilter !== "all" && entry.blood_type !== bloodTypeFilter) {
      return false
    }

    // Apply entry type filter
    if (entryTypeFilter !== "all" && entry.type !== entryTypeFilter) {
      return false
    }

    return true
  })

  const clearFilters = () => {
    setBloodTypeFilter("all")
    setEntryTypeFilter("all")
  }

  const isFiltering = bloodTypeFilter !== "all" || entryTypeFilter !== "all"

  // Add mock data for preview environments
  const isPreviewEnvironment =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development"

  // If in preview mode and no entries, use mock data
  useEffect(() => {
    if (isPreviewEnvironment && entries.length === 0 && !loading && !error) {
      console.log("Using mock data for preview environment")
      setEntries([
        {
          type: "RedBlood",
          bag_id: 1001,
          donor_name: "John Doe",
          blood_type: "A",
          rh: "+",
          amount: 450,
          expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          hospital_name: "Central Hospital",
          hospital_id: 1,
          active: true,
        },
        {
          type: "Plasma",
          bag_id: 2001,
          donor_name: "Jane Smith",
          blood_type: "O",
          rh: "",
          amount: 300,
          expiration_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          hospital_name: "Central Hospital",
          hospital_id: 1,
          active: true,
        },
        {
          type: "Platelets",
          bag_id: 3001,
          donor_name: "Robert Johnson",
          blood_type: "B",
          rh: "-",
          amount: 250,
          expiration_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          hospital_name: "Central Hospital",
          hospital_id: 1,
          active: true,
        },
      ])
    }
  }, [isPreviewEnvironment, entries.length, loading, error])

  return (
    <div>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by donor name or bag ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Select value={bloodTypeFilter} onValueChange={setBloodTypeFilter}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Blood Type: {bloodTypeFilter === "all" ? "All" : bloodTypeFilter}</span>
                  </div>
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
            <div className="flex-1">
              <Select value={entryTypeFilter} onValueChange={setEntryTypeFilter}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Entry Type: {entryTypeFilter === "all" ? "All" : entryTypeFilter}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="RedBlood">Red Blood Cells</SelectItem>
                  <SelectItem value="Plasma">Plasma</SelectItem>
                  <SelectItem value="Platelets">Platelets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isFiltering && (
              <Button variant="outline" onClick={clearFilters} className="md:w-auto">
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">Loading data...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isFiltering
                ? "No entries match the selected filters"
                : showInactive
                  ? "No deleted entries found"
                  : "No entries found"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bag ID</TableHead>
                  <TableHead>Donor Name</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={`${entry.type}-${entry.bag_id}`}>
                    <TableCell>{entry.bag_id}</TableCell>
                    <TableCell>{entry.donor_name}</TableCell>
                    <TableCell>
                      {formatBloodType(entry.blood_type, entry.type !== "Plasma" ? entry.rh : undefined)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.type}</Badge>
                    </TableCell>
                    <TableCell>{entry.amount} ml</TableCell>
                    <TableCell>{new Date(entry.expiration_date).toLocaleDateString()}</TableCell>
                    <TableCell>{entry.hospital_name}</TableCell>
                    <TableCell>
                      {entry.active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {/* Only show edit for active entries and if user is from the same hospital */}
                        {entry.active && entry.hospital_id === hospitalId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(entry)}
                            className="h-8 px-2"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only md:not-sr-only md:ml-2">Edit</span>
                          </Button>
                        )}

                        {/* Show delete for active entries or restore for inactive entries */}
                        {entry.hospital_id === hospitalId &&
                          (entry.active ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => confirmDelete(entry)}
                              className="h-8 px-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only md:not-sr-only md:ml-2">Delete</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => confirmRestore(entry)}
                              className="h-8 px-2 text-green-600 hover:text-green-700"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span className="sr-only md:not-sr-only md:ml-2">Restore</span>
                            </Button>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={entryToDelete !== null}
        onClose={() => setEntryToDelete(null)}
        onConfirm={() => {
          if (entryToDelete) {
            handleDelete(entryToDelete)
            setEntryToDelete(null)
          }
        }}
        title="Confirm Deletion"
        description={`Are you sure you want to delete the entry for ${entryToDelete?.donor_name}? This action can be undone later.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ConfirmationDialog
        isOpen={entryToRestore !== null}
        onClose={() => setEntryToRestore(null)}
        onConfirm={() => {
          if (entryToRestore) {
            handleRestore(entryToRestore)
            setEntryToRestore(null)
          }
        }}
        title="Confirm Restoration"
        description={`Are you sure you want to restore the entry for ${entryToRestore?.donor_name}?`}
        confirmText="Restore"
        cancelText="Cancel"
      />

      {entryToEdit && (
        <EditEntryDialog
          entry={entryToEdit}
          open={entryToEdit !== null}
          onOpenChange={(open) => {
            if (!open) setEntryToEdit(null)
          }}
          onSave={handleUpdate}
        />
      )}
    </div>
  )
}
