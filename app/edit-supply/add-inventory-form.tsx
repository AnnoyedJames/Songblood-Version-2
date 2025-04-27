"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

type AddInventoryFormProps = {
  type: string
  hospitalId: number
  onSuccess: (newItem: any) => void
  onError: (message: string) => void
}

type FormState = {
  donorName: string
  amount: string
  expirationDate: string
  bloodType: string
  rh: string
}

export default function AddInventoryForm({ type, hospitalId, onSuccess, onError }: AddInventoryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formState, setFormState] = useState<FormState>({
    donorName: "",
    amount: "",
    expirationDate: "",
    bloodType: "",
    rh: "+",
  })

  // Get appropriate title based on type
  const getTitle = () => {
    switch (type) {
      case "redblood":
        return "Add Red Blood Cell"
      case "plasma":
        return "Add Plasma"
      case "platelets":
        return "Add Platelets"
      default:
        return "Add Inventory"
    }
  }

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  // Handle blood type change
  const handleBloodTypeChange = (value: string) => {
    setFormState((prev) => ({ ...prev, bloodType: value }))
  }

  // Handle Rh change
  const handleRhChange = (value: string) => {
    setFormState((prev) => ({ ...prev, rh: value }))
  }

  // Get min date for expiration (today)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Basic validation
      if (!formState.donorName || !formState.amount || !formState.expirationDate || !formState.bloodType) {
        throw new Error("Please fill in all required fields")
      }

      // Validate amount is a positive number
      const amount = Number.parseFloat(formState.amount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Amount must be a positive number")
      }

      // Create appropriate API endpoint based on type
      let endpoint = ""
      switch (type) {
        case "redblood":
          endpoint = "/api/add-redblood"
          break
        case "plasma":
          endpoint = "/api/add-plasma"
          break
        case "platelets":
          endpoint = "/api/add-platelets"
          break
        default:
          throw new Error("Invalid inventory type")
      }

      // Send request to API
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          donorName: formState.donorName,
          amount,
          hospitalId,
          expirationDate: formState.expirationDate,
          bloodType: formState.bloodType,
          rh: formState.rh,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add inventory item")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to add inventory item")
      }

      // Reset form
      setFormState({
        donorName: "",
        amount: "",
        expirationDate: "",
        bloodType: "",
        rh: "+",
      })

      // Notify parent of success
      onSuccess({
        donor_name: formState.donorName,
        amount,
        blood_type: formState.bloodType,
        rh: formState.rh,
        expiration_date: formState.expirationDate,
      })

      // Refresh router data
      router.refresh()
    } catch (error: any) {
      onError(error.message || "An error occurred while adding the inventory item")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
        <CardDescription>Add a new {type.replace("redblood", "red blood cell")} inventory item</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="donorName">Donor Name</Label>
            <Input id="donorName" name="donorName" value={formState.donorName} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ml)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="100"
              max="500"
              value={formState.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date</Label>
            <Input
              id="expirationDate"
              name="expirationDate"
              type="date"
              min={getMinDate()}
              value={formState.expirationDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Blood Type</Label>
              <Select name="bloodType" value={formState.bloodType} onValueChange={handleBloodTypeChange} required>
                <SelectTrigger id="bloodType">
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

            <div className="space-y-2">
              <Label>Rh Factor</Label>
              <RadioGroup value={formState.rh} onValueChange={handleRhChange} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="+" id="rh-positive" />
                  <Label htmlFor="rh-positive">Positive (+)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="-" id="rh-negative" />
                  <Label htmlFor="rh-negative">Negative (-)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : `Add ${type.replace("redblood", "Red Blood Cell")}`}
          </Button>
        </form>
      </CardContent>
    </>
  )
}
