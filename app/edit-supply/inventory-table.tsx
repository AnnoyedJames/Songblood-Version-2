"use client"

import { formatBloodType, getBloodTypeColor, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { useState } from "react"
import EditInventoryDialog from "./edit-inventory-dialog"

type InventoryItem = {
  bag_id?: number
  blood_type: string
  rh?: string
  count: number
  total_amount: number
  donor_name?: string
  expiration_date?: string
  amount?: number
}

type InventoryTableProps = {
  type: string
  title: string
  inventory: InventoryItem[]
  hospitalId: number
  onUpdate: (inventory: InventoryItem[]) => void
  onShowAlert: (type: "success" | "error", message: string) => void
}

export default function InventoryTable({
  type,
  title,
  inventory,
  hospitalId,
  onUpdate,
  onShowAlert,
}: InventoryTableProps) {
  const router = useRouter()
  const [detailedInventory, setDetailedInventory] = useState<InventoryItem[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<number | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)

  // Load detailed inventory if not already loaded
  const loadDetailedInventory = async () => {
    if (detailedInventory.length > 0) return

    setIsLoadingDetails(true)
    try {
      const response = await fetch(`/api/inventory/${type}/details?hospitalId=${hospitalId}`)
      if (!response.ok) throw new Error("Failed to load detailed inventory")

      const data = await response.json()
      setDetailedInventory(data.inventory)
    } catch (error) {
      console.error("Error loading detailed inventory:", error)
      onShowAlert("error", "Failed to load detailed inventory")
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Load details if inventory is just a summary (aggregated data)
  if (inventory.length > 0 && !inventory[0].bag_id && !isLoadingDetails && detailedInventory.length === 0) {
    loadDetailedInventory()
  }

  // The inventory to display (either detailed or summary)
  const displayInventory = detailedInventory.length > 0 ? detailedInventory : inventory

  // Handle delete
  const handleDelete = async () => {
    if (!deleteItem) return

    try {
      const response = await fetch(`/api/inventory/${type}/${deleteItem}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hospitalId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete item")
      }

      // Update local state
      const updatedInventory = detailedInventory.filter((item) => item.bag_id !== deleteItem)
      setDetailedInventory(updatedInventory)

      // Notify parent
      onShowAlert("success", "Item successfully deleted")

      // Refresh inventory from server
      loadDetailedInventory()
      router.refresh()
    } catch (error: any) {
      onShowAlert("error", error.message || "Error deleting item")
    } finally {
      setDeleteDialogOpen(false)
      setDeleteItem(null)
    }
  }

  // Handle view
  const handleView = (bagId: number) => {
    router.push(`/donor/${bagId}?type=${type}`)
  }

  // Handle edit
  const handleEdit = (item: InventoryItem) => {
    setEditItem(item)
    setEditDialogOpen(true)
  }

  // Handle save edit
  const handleSaveEdit = async (editedItem: InventoryItem) => {
    try {
      if (!editedItem.bag_id) throw new Error("Missing bag ID")

      const response = await fetch(`/api/inventory/${type}/${editedItem.bag_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editedItem,
          hospitalId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update item")
      }

      // Update local state
      const updatedInventory = detailedInventory.map((item) => (item.bag_id === editedItem.bag_id ? editedItem : item))
      setDetailedInventory(updatedInventory)

      // Notify parent
      onShowAlert("success", "Item successfully updated")

      // Close dialog
      setEditDialogOpen(false)
      setEditItem(null)

      // Refresh inventory from server
      loadDetailedInventory()
      router.refresh()
    } catch (error: any) {
      onShowAlert("error", error.message || "Error updating item")
    }
  }

  // Sort inventory by blood type and Rh factor
  const sortedInventory = [...displayInventory].sort((a, b) => {
    // First sort by blood type
    if (a.blood_type !== b.blood_type) {
      // Custom sort order: O, A, B, AB
      const typeOrder = { O: 1, A: 2, B: 3, AB: 4 }
      return (
        (typeOrder[a.blood_type as keyof typeof typeOrder] || 99) -
        (typeOrder[b.blood_type as keyof typeof typeOrder] || 99)
      )
    }

    // Then sort by Rh factor if blood types are the same
    if (a.rh && b.rh) {
      // + comes before -
      return a.rh === "+" ? -1 : 1
    }

    return 0
  })

  return (
    <>
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="text-sm text-muted-foreground">
          {isLoadingDetails ? "Loading..." : `${displayInventory.length} entries`}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Blood Type</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {isLoadingDetails ? "Loading inventory..." : "No inventory data available"}
                </TableCell>
              </TableRow>
            ) : (
              sortedInventory.map((item, index) => (
                <TableRow key={item.bag_id || index}>
                  <TableCell>{item.bag_id || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                      {formatBloodType(item.blood_type, item.rh)}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.donor_name || "-"}</TableCell>
                  <TableCell>{(item.amount || item.total_amount)?.toLocaleString()} ml</TableCell>
                  <TableCell>{item.expiration_date ? formatDate(item.expiration_date) : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {item.bag_id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(item.bag_id!)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setDeleteItem(item.bag_id!)
                              setDeleteDialogOpen(true)
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {editItem && (
        <EditInventoryDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          item={editItem}
          type={type}
          onSave={handleSaveEdit}
        />
      )}
    </>
  )
}
