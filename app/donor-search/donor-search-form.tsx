"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, RefreshCw, AlertCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { EditEntryDialog } from "@/components/edit-entry-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

type DonorResult = {
  type: string
  bag_id: number
  donor_name: string
  blood_type: string
  rh: string
  amount: number
  expiration_date: string
  hospital_name: string
  hospital_contact_phone: string
  hospital_id: number
  active: boolean
}

export default function DonorSearchForm() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("query") || ""

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<DonorResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [currentHospitalId, setCurrentHospitalId] = useState<number | null>(null)

  // State for edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [currentEntry, setCurrentEntry] = useState<DonorResult | null>(null)

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<DonorResult | null>(null)

  // State for restore confirmation dialog
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [entryToRestore, setEntryToRestore] = useState<DonorResult | null>(null)

  // Fetch current hospital ID on component mount
  useEffect(() => {
    async function fetchCurrentHospital() {
      try {
        const response = await fetch("/api/current-hospital")
        if (response.ok) {
          const data = await response.json()
          setCurrentHospitalId(data.hospitalId)
        }
      } catch (error) {
        console.error("Error fetching current hospital:", error)
      }
    }

    fetchCurrentHospital()
  }, [])

  // Perform search if initial query exists
  useEffect(() => {
    if (initialQuery) {
      handleSearch()
    }
  }, [initialQuery, showInactive])

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search term")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&showInactive=${showInactive}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to search donors")
      }

      const data = await response.json()
      setResults(data.results || [])

      // Update URL with search query
      router.push(`/donor-search?query=${encodeURIComponent(query)}`)
    } catch (error) {
      console.error("Search error:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (entry: DonorResult) => {
    setCurrentEntry(entry)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (entry: DonorResult) => {
    setEntryToDelete(entry)
    setDeleteDialogOpen(true)
  }

  const handleRestoreClick = (entry: DonorResult) => {
    setEntryToRestore(entry)
    setRestoreDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!entryToDelete) return

    try {
      const response = await fetch("/api/donor/soft-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bagId: entryToDelete.bag_id,
          entryType: entryToDelete.type,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete entry")
      }

      toast({
        title: "Entry deleted",
        description: "The entry has been successfully deleted.",
      })

      // Update the results list
      setResults(
        results.map((item) =>
          item.bag_id === entryToDelete.bag_id && item.type === entryToDelete.type ? { ...item, active: false } : item,
        ),
      )
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete entry",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
    }
  }

  const handleRestore = async () => {
    if (!entryToRestore) return

    try {
      const response = await fetch("/api/donor/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bagId: entryToRestore.bag_id,
          entryType: entryToRestore.type,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to restore entry")
      }

      toast({
        title: "Entry restored",
        description: "The entry has been successfully restored.",
      })

      // Update the results list
      setResults(
        results.map((item) =>
          item.bag_id === entryToRestore.bag_id && item.type === entryToRestore.type ? { ...item, active: true } : item,
        ),
      )
    } catch (error) {
      console.error("Restore error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore entry",
        variant: "destructive",
      })
    } finally {
      setRestoreDialogOpen(false)
      setEntryToRestore(null)
    }
  }

  const handleEditSave = async (updatedEntry: any) => {
    try {
      const response = await fetch("/api/donor/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bagId: updatedEntry.bagId,
          entryType: updatedEntry.entryType,
          donorName: updatedEntry.donorName,
          amount: updatedEntry.amount,
          expirationDate: updatedEntry.expirationDate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update entry")
      }

      toast({
        title: "Entry updated",
        description: "The entry has been successfully updated.",
      })

      // Refresh the search results
      handleSearch()
    } catch (error) {
      console.error("Update error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update entry",
        variant: "destructive",
      })
    } finally {
      setEditDialogOpen(false)
      setCurrentEntry(null)
    }
  }

  const canEditEntry = (entry: DonorResult) => {
    return currentHospitalId === entry.hospital_id
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Donor Search</CardTitle>
          <CardDescription>Search for donors by name or bag ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Enter donor name or bag ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
              <Label htmlFor="show-inactive">Show inactive records</Label>
            </div>

            {error && (
              <div className="bg-red-50 p-3 rounded-md flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {results.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Bag ID</TableHead>
                      <TableHead>Donor Name</TableHead>
                      <TableHead>Blood Type</TableHead>
                      <TableHead>Amount (ml)</TableHead>
                      <TableHead>Expiration Date</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={`${result.type}-${result.bag_id}`} className={!result.active ? "opacity-60" : ""}>
                        <TableCell>{result.type}</TableCell>
                        <TableCell>{result.bag_id}</TableCell>
                        <TableCell>{result.donor_name}</TableCell>
                        <TableCell>
                          {result.blood_type}
                          {result.rh && result.rh}
                        </TableCell>
                        <TableCell>{result.amount}</TableCell>
                        <TableCell>{new Date(result.expiration_date).toLocaleDateString()}</TableCell>
                        <TableCell>{result.hospital_name}</TableCell>
                        <TableCell>
                          {result.active ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {canEditEntry(result) && result.active && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditClick(result)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}

                            {canEditEntry(result) && result.active && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteClick(result)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}

                            {canEditEntry(result) && !result.active && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleRestoreClick(result)}
                                title="Restore"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              !loading && !error && <p className="text-center py-4">No results found</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">{results.length > 0 && `Found ${results.length} results`}</div>
        </CardFooter>
      </Card>

      {currentEntry && (
        <EditEntryDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          entry={{
            bagId: currentEntry.bag_id,
            entryType: currentEntry.type,
            donorName: currentEntry.donor_name,
            amount: currentEntry.amount,
            expirationDate: new Date(currentEntry.expiration_date).toISOString().split("T")[0],
          }}
          onSave={handleEditSave}
        />
      )}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Entry"
        description="Are you sure you want to delete this entry? This will make it inactive but the data will be preserved."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
      />

      <ConfirmationDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="Restore Entry"
        description="Are you sure you want to restore this entry? This will make it active again."
        confirmText="Restore"
        cancelText="Cancel"
        onConfirm={handleRestore}
      />
    </>
  )
}
