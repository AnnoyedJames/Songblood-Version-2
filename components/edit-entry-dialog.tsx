"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

type EditEntryDialogProps = {
  entry: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedEntry: any) => Promise<{ success: boolean; message?: string }>
}

export function EditEntryDialog({ entry, open, onOpenChange, onSave }: EditEntryDialogProps) {
  const [formData, setFormData] = useState({
    ...entry,
    // Convert date string to YYYY-MM-DD format for the date input
    expiration_date: entry.expiration_date ? entry.expiration_date.split("T")[0] : "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const result = await onSave(formData)
      if (result.success) {
        toast({
          title: "Entry Updated",
          description: "The entry has been successfully updated.",
        })
        onOpenChange(false)
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: result.message || "Failed to update the entry.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "An unexpected error occurred.",
      })
      console.error("Error updating entry:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Determine if this is a plasma entry (which doesn't have Rh factor)
  const isPlasma = entry.type === "Plasma"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit {entry.type} Entry</DialogTitle>
          <DialogDescription>Make changes to the blood entry details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="donor_name" className="text-right">
              Donor Name
            </Label>
            <Input
              id="donor_name"
              value={formData.donor_name}
              onChange={(e) => handleChange("donor_name", e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="blood_type" className="text-right">
              Blood Type
            </Label>
            <Select value={formData.blood_type} onValueChange={(value) => handleChange("blood_type", value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select blood type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="AB">AB</SelectItem>
                <SelectItem value="O">O</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isPlasma && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rh" className="text-right">
                Rh Factor
              </Label>
              <Select value={formData.rh} onValueChange={(value) => handleChange("rh", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Rh factor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+">Positive (+)</SelectItem>
                  <SelectItem value="-">Negative (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount (ml)
            </Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => handleChange("amount", Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expiration_date" className="text-right">
              Expiration
            </Label>
            <Input
              id="expiration_date"
              type="date"
              value={formData.expiration_date}
              onChange={(e) => handleChange("expiration_date", e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditEntryDialog
