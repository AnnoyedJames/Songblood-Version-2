"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, Trash2, RefreshCw, RotateCcw } from "lucide-react"
import ConfirmationDialog from "./confirmation-dialog"

type EntryType = {
  id: string
  donor_name: string
  blood_type: string
  hospital: string
  date_added: string
  quantity: number
  is_active: boolean
}

export default function DataDiagnostics() {
  const [redBloodData, setRedBloodData] = useState<EntryType[]>([])
  const [deletedEntries, setDeletedEntries] = useState<EntryType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<EntryType | null>(null)
  const [entryToRestore, setEntryToRestore] = useState<EntryType | null>(null)
  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/diagnostics/redblood")
      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }
      const data = await response.json()
      setRedBloodData(data)
    } catch (err) {
      setError("Error fetching data: " + (err instanceof Error ? err.message : String(err)))
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load diagnostic data",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDeletedEntries = async () => {
    try {
      const response = await fetch("/api/diagnostics/deleted-entries")
      if (!response.ok) {
        throw new Error("Failed to fetch deleted entries")
      }
      const data = await response.json()
      setDeletedEntries(data)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load deleted entries",
      })
    }
  }

  useEffect(() => {
    fetchData()
    fetchDeletedEntries()
  }, [])

  const handleDelete = async (entry: EntryType) => {
    try {
      const response = await fetch("/api/diagnostics/delete-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: entry.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete entry")
      }

      toast({
        title: "Entry Deleted",
        description: `Entry for ${entry.donor_name} has been deleted.`,
      })

      // Refresh data
      fetchData()
      fetchDeletedEntries()
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
      const response = await fetch("/api/diagnostics/restore-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: entry.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to restore entry")
      }

      toast({
        title: "Entry Restored",
        description: `Entry for ${entry.donor_name} has been restored.`,
      })

      // Refresh data
      fetchData()
      fetchDeletedEntries()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to restore entry: " + (err instanceof Error ? err.message : String(err)),
      })
    }
  }

  const confirmDelete = (entry: EntryType) => {
    setEntryToDelete(entry)
  }

  const confirmRestore = (entry: EntryType) => {
    setEntryToRestore(entry)
  }

  if (loading) {
    return <div className="text-center py-4">Loading diagnostic data...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
        <AlertCircle className="text-red-500 mr-2 mt-0.5" />
        <div>
          <h3 className="text-red-800 font-medium">Error loading diagnostic data</h3>
          <p className="text-red-700 mt-1">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={() => setShowDeleted(!showDeleted)}>
          {showDeleted ? "Show Active Entries" : "Show Deleted Entries"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            fetchData()
            fetchDeletedEntries()
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {showDeleted ? (
        <Card>
          <CardHeader>
            <CardTitle>Deleted Entries</CardTitle>
            <CardDescription>Entries that have been soft-deleted from the system</CardDescription>
          </CardHeader>
          <CardContent>
            {deletedEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No deleted entries found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor Name</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.donor_name}</TableCell>
                      <TableCell>{entry.blood_type}</TableCell>
                      <TableCell>{entry.hospital}</TableCell>
                      <TableCell>{new Date(entry.date_added).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.quantity} ml</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmRestore(entry)}
                          className="flex items-center"
                        >
                          <RotateCcw className="mr-1 h-3 w-3" />
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Red Blood Cell Entries</CardTitle>
            <CardDescription>Diagnostic view of all red blood cell entries</CardDescription>
          </CardHeader>
          <CardContent>
            {redBloodData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No entries found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor Name</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redBloodData.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.donor_name}</TableCell>
                      <TableCell>{entry.blood_type}</TableCell>
                      <TableCell>{entry.hospital}</TableCell>
                      <TableCell>{new Date(entry.date_added).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.quantity} ml</TableCell>
                      <TableCell>
                        {entry.is_active ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <AlertCircle className="mr-1 h-4 w-4" />
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDelete(entry)}
                          className="flex items-center text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

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
    </div>
  )
}
