"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatBloodType } from "@/lib/utils"

interface BloodEntry {
  bag_id: number
  donor_name: string
  blood_type: string
  rh: string
  amount: number
  expiration_date: string
  type: "RedBlood" | "Plasma" | "Platelets"
}

interface EditEntryDialogProps {
  entry: BloodEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedEntry: BloodEntry) => Promise<{ success: boolean; message?: string }>
}

export function EditEntryDialog({ entry, open, onOpenChange, onSave }: EditEntryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<BloodEntry | null>(entry)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Update form data when entry changes
  useEffect(() => {
    setFormData(entry)
  }, [entry])

  if (!entry || !formData) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [name]: name === "amount" ? Math.max(1, Number.parseInt(value) || 0) : value,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    try {
      setIsLoading(true)
      setErrorMessage(null)
      const result = await onSave(formData)

      if (result.success) {
        onOpenChange(false)
      } else {
        setErrorMessage(result.message || "Failed to update the entry. Please try again.")
      }
    } catch (error) {
      console.error("Error updating entry:", error)
      setErrorMessage("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Blood Entry</DialogTitle>
          <DialogDescription>
            Update the details for {formatBloodType(entry.blood_type, entry.rh)} bag #{entry.bag_id}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {errorMessage && <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4 text-sm">{errorMessage}</div>}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="donor_name" className="text-right">
                Donor Name
              </Label>
              <Input
                id="donor_name"
                name="donor_name"
                value={formData.donor_name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount (ml)
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="1"
                max="1000"
                value={formData.amount}
                onChange={handleChange}
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
                value={formData.expiration_date.split("T")[0]}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
