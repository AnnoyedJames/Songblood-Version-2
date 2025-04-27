"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type InventoryItem = {
  bag_id?: number
  blood_type: string
  rh?: string
  donor_name?: string
  amount?: number
  expiration_date?: string
}

type EditInventoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem
  type: string
  onSave: (item: InventoryItem) => void
}

export default function EditInventoryDialog({ open, onOpenChange, item, type, onSave }: EditInventoryDialogProps) {
  const [editedItem, setEditedItem] = useState<InventoryItem>({ ...item })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditedItem((prev) => ({ ...prev, [name]: value }))
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      setEditedItem((prev) => ({ ...prev, amount: value }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate
      if (!editedItem.donor_name || !editedItem.blood_type || !editedItem.amount) {
        throw new Error("Please fill in all required fields")
      }

      onSave(editedItem)
    } catch (error) {
      console.error("Validation error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit {type[0].toUpperCase() + type.slice(1)} Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="donor_name" className="text-right">
                Donor
              </Label>
              <Input
                id="donor_name"
                name="donor_name"
                value={editedItem.donor_name || ""}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="blood_type" className="text-right">
                Blood Type
              </Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <Select
                  value={editedItem.blood_type}
                  onValueChange={(value) => setEditedItem((prev) => ({ ...prev, blood_type: value }))}
                >
                  <SelectTrigger id="blood_type">
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                  </SelectContent>
                </Select>

                <RadioGroup
                  value={editedItem.rh || "+"}
                  onValueChange={(value) => setEditedItem((prev) => ({ ...prev, rh: value }))}
                  className="flex items-center space-x-2"
                >
                  <div className="flex items-center">
                    <RadioGroupItem value="+" id="rh-positive" />
                    <Label htmlFor="rh-positive" className="ml-2">
                      +
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="-" id="rh-negative" />
                    <Label htmlFor="rh-negative" className="ml-2">
                      -
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount (ml)
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="1"
                value={editedItem.amount || ""}
                onChange={handleAmountChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiration_date" className="text-right">
                Expiration
              </Label>
              <Input
                id="expiration_date"
                name="expiration_date"
                type="date"
                value={
                  editedItem.expiration_date ? new Date(editedItem.expiration_date).toISOString().split("T")[0] : ""
                }
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
