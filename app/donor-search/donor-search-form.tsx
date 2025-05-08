"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatBloodType, formatDate, getBloodTypeColor } from "@/lib/utils"
import { Search, Edit, Trash2, RefreshCw } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ErrorType } from "@/lib/error-handling"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { EditEntryDialog } from "@/components/edit-entry-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useToast } from "@/components/ui/use-toast"

type SearchResult = {
  type: string
  bag_id: number
  donor_name: string
  blood_type: string
  rh: string
  amount: number
  expiration_date: string
  hospital_name: string
  hospital_contact_phone: string
  hospital_id?: number
  active?: boolean
}

export default function DonorSearchForm() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState("")
  const [errorType, setErrorType] = useState<ErrorType | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<SearchResult | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentHospitalId, setCurrentHospitalId] = useState<number | null>(null)
  const { toast } = useToast()

  // Fetch current hospital ID on component mount
  useEffect(() => {
    async function fetchCurrentHospital() {
      try {
        const response = await fetch("/api/current-hospital")
        const data = await response.json()
        if (data.success) {
          setCurrentHospitalId(data.hospitalId)
        }
      } catch (err) {
        console.error("Error fetching current hospital:", err)
      }
    }

    fetchCurrentHospital()
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()

    if (!query.trim()) return

    setIsLoading(true)
    setSearched(true)
    setError("")
    setErrorType(null)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&showInactive=${showInactive}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.results)
      } else {
        setResults([])
        setError(data.error || "Search failed. Please try again.")
        setErrorType(data.type || null)
      }
    } catch (err) {
      console.error("Search error:", err)
      setResults([])
      setError("Connection error. Please try again later.")
      setErrorType(ErrorType.SERVER)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (entry: SearchResult) => {
    setSelectedEntry(entry)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async (updatedEntry: SearchResult) => {
    try {
      const response = await fetch("/api/donor/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedEntry),
      })

      const result = await response.json()

      if (result.success) {
        // Update the entry in the results array
        setResults((prevResults) =>
          prevResults.map((item) =>
            item.type === updatedEntry.type && item.bag_id === updatedEntry.bag_id ? updatedEntry : item,
          ),
        )
        return { success: true }
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: result.error || "Failed to update the entry. Please try again.",
        })
        return { success: false, message: result.error }
      }
    } catch (error) {
      console.error("Error updating entry:", error)
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
      })
      return { success: false, message: "An unexpected error occurred" }
    }
  }

  const handleSoftDelete = async (entry: SearchResult) => {
    try {
      const response = await fetch("/api/donor/soft-delete", {
        method: "DELETE",
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
        // If not showing inactive entries, remove from list
        if (!showInactive) {
          setResults((prevResults) =>
            prevResults.filter((item) => !(item.type === entry.type && item.bag_id === entry.bag_id)),
          )
        } else {
          // Otherwise mark as inactive
          setResults((prevResults) =>
            prevResults.map((item) =>
              item.type === entry.type && item.bag_id === entry.bag_id ? { ...item, active: false } : item,
            ),
          )
        }

        toast({
          title: "Entry deleted",
          description: "The entry has been successfully removed from active records.",
        })
        return true
      } else {
        toast({
          variant: "destructive",
          title: "Deletion failed",
          description: result.error || "Failed to delete the entry. Please try again.",
        })
        return false
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: "An unexpected error occurred. Please try again.",
      })
      return false
    }
  }

  const handleRestoreEntry = async (entry: SearchResult) => {
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

      const result = await response.json()

      if (result.success) {
        // Mark as active in the results
        setResults((prevResults) =>
          prevResults.map((item) =>
            item.type === entry.type && item.bag_id === entry.bag_id ? { ...item, active: true } : item,
          ),
        )

        toast({
          title: "Entry restored",
          description: "The entry has been successfully restored to active records.",
        })
        return true
      } else {
        toast({
          variant: "destructive",
          title: "Restoration failed",
          description: result.error || "Failed to restore the entry. Please try again.",
        })
        return false
      }
    } catch (error) {
      console.error("Error restoring entry:", error)
      toast({
        variant: "destructive",
        title: "Restoration failed",
        description: "An unexpected error occurred. Please try again.",
      })
      return false
    }
  }

  const toggleShowInactive = () => {
    setShowInactive(!showInactive)
    if (searched && query.trim()) {
      // Re-run the search with the new filter
      const event = { preventDefault: () => {} } as React.FormEvent
      handleSearch(event)
    }
  }

  // Check if the entry belongs to the current hospital
  const canEditEntry = (entry: SearchResult) => {
    return entry.hospital_id === currentHospitalId
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Donors</CardTitle>
        <CardDescription>Search by donor name or bag ID across all hospitals</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant={errorType === ErrorType.DATABASE_CONNECTION ? "warning" : "destructive"} className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <Input
            placeholder="Enter donor name or bag ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
            {!isLoading && <Search className="ml-2 h-4 w-4" />}
          </Button>
        </form>

        <div className="flex items-center space-x-2 mb-4">
          <Switch id="show-inactive" checked={showInactive} onCheckedChange={toggleShowInactive} />
          <Label htmlFor="show-inactive">
            {showInactive ? "Showing inactive records" : "Showing active records only"}
          </Label>
        </div>

        {searched && !error && (
          <div>
            <h3 className="text-lg font-medium mb-4">Search Results {results.length > 0 && `(${results.length})`}</h3>

            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No results found for "{query}"</div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bag ID</TableHead>
                      <TableHead>Donor Name</TableHead>
                      <TableHead>Blood Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Expiration Date</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow
                        key={`${result.type}-${result.bag_id}`}
                        className={result.active === false ? "opacity-60" : ""}
                      >
                        <TableCell>{result.bag_id}</TableCell>
                        <TableCell>{result.donor_name}</TableCell>
                        <TableCell>
                          <Badge className={getBloodTypeColor(result.blood_type, result.rh)}>
                            {formatBloodType(result.blood_type, result.rh)}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.amount} ml</TableCell>
                        <TableCell>{formatDate(result.expiration_date)}</TableCell>
                        <TableCell>
                          <div>{result.hospital_name}</div>
                          <div className="text-xs text-muted-foreground">{result.hospital_contact_phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {result.active === false ? (
                            <Badge variant="outline" className="bg-gray-100">
                              Inactive
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {canEditEntry(result) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditClick(result)}
                                  disabled={result.active === false}
                                  title="Edit entry"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                {result.active === false ? (
                                  <ConfirmationDialog
                                    title="Restore Entry"
                                    description={`Are you sure you want to restore this ${result.type} entry for ${result.donor_name}?`}
                                    actionLabel="Restore"
                                    variant="default"
                                    onConfirm={async () => {
                                      await handleRestoreEntry(result)
                                    }}
                                    trigger={
                                      <Button variant="outline" size="icon" title="Restore entry">
                                        <RefreshCw className="h-4 w-4" />
                                      </Button>
                                    }
                                  />
                                ) : (
                                  <ConfirmationDialog
                                    title="Delete Entry"
                                    description={`Are you sure you want to delete this ${result.type} entry for ${result.donor_name}?`}
                                    actionLabel="Delete"
                                    onConfirm={async () => {
                                      await handleSoftDelete(result)
                                    }}
                                    trigger={
                                      <Button variant="outline" size="icon" title="Delete entry">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    }
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Edit Dialog */}
        <EditEntryDialog
          entry={selectedEntry}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveEdit}
        />
      </CardContent>
    </Card>
  )
}
