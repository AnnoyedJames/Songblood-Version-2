"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ErrorType } from "@/lib/error-handling"

type AddSupplyFormProps = {
  hospitalId: number
}

export default function AddSupplyForm({ hospitalId }: AddSupplyFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [errorType, setErrorType] = useState<ErrorType | null>(null)
  const [success, setSuccess] = useState("")

  // Plasma form state
  const [plasmaForm, setPlasmaForm] = useState({
    donorName: "",
    amount: "",
    expirationDate: "",
    bloodType: "",
  })

  // Platelets form state
  const [plateletsForm, setPlateletsForm] = useState({
    donorName: "",
    amount: "",
    expirationDate: "",
    bloodType: "",
    rh: "+",
  })

  // Handle plasma form change
  const handlePlasmaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPlasmaForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle platelets form change
  const handlePlateletsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPlateletsForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle platelets Rh change
  const handleRhChange = (value: string) => {
    setPlateletsForm((prev) => ({ ...prev, rh: value }))
  }

  // Handle plasma form submit
  const handlePlasmaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setErrorType(null)
    setSuccess("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/add-plasma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...plasmaForm,
          amount: Number(plasmaForm.amount),
          hospitalId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Plasma bag added successfully!")
        setPlasmaForm({
          donorName: "",
          amount: "",
          expirationDate: "",
          bloodType: "",
        })
        router.refresh()
      } else {
        setError(data.error || "Failed to add plasma bag. Please try again.")
        setErrorType(data.type || null)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      setErrorType(ErrorType.SERVER)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle platelets form submit
  const handlePlateletsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setErrorType(null)
    setSuccess("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/add-platelets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...plateletsForm,
          amount: Number(plateletsForm.amount),
          hospitalId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Platelets bag added successfully!")
        setPlateletsForm({
          donorName: "",
          amount: "",
          expirationDate: "",
          bloodType: "",
          rh: "+",
        })
        router.refresh()
      } else {
        setError(data.error || "Failed to add platelets bag. Please try again.")
        setErrorType(data.type || null)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      setErrorType(ErrorType.SERVER)
    } finally {
      setIsLoading(false)
    }
  }

  // Get min date for expiration (today)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Supply</CardTitle>
        <CardDescription>Add new plasma or platelets to your hospital's inventory</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant={errorType === ErrorType.DATABASE_CONNECTION ? "warning" : "destructive"} className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 text-green-700 bg-green-50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="plasma">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="plasma">Plasma</TabsTrigger>
            <TabsTrigger value="platelets">Platelets</TabsTrigger>
          </TabsList>

          <TabsContent value="plasma">
            <form onSubmit={handlePlasmaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plasma-donorName">Donor Name</Label>
                <Input
                  id="plasma-donorName"
                  name="donorName"
                  value={plasmaForm.donorName}
                  onChange={handlePlasmaChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plasma-amount">Amount (ml)</Label>
                <Input
                  id="plasma-amount"
                  name="amount"
                  type="number"
                  min="100"
                  max="500"
                  value={plasmaForm.amount}
                  onChange={handlePlasmaChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plasma-expirationDate">Expiration Date</Label>
                <Input
                  id="plasma-expirationDate"
                  name="expirationDate"
                  type="date"
                  min={getMinDate()}
                  value={plasmaForm.expirationDate}
                  onChange={handlePlasmaChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plasma-bloodType">Blood Type</Label>
                <Select
                  name="bloodType"
                  value={plasmaForm.bloodType}
                  onValueChange={(value) => setPlasmaForm((prev) => ({ ...prev, bloodType: value }))}
                  required
                >
                  <SelectTrigger id="plasma-bloodType">
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Plasma Bag"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="platelets">
            <form onSubmit={handlePlateletsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platelets-donorName">Donor Name</Label>
                <Input
                  id="platelets-donorName"
                  name="donorName"
                  value={plateletsForm.donorName}
                  onChange={handlePlateletsChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platelets-amount">Amount (ml)</Label>
                <Input
                  id="platelets-amount"
                  name="amount"
                  type="number"
                  min="100"
                  max="500"
                  value={plateletsForm.amount}
                  onChange={handlePlateletsChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platelets-expirationDate">Expiration Date</Label>
                <Input
                  id="platelets-expirationDate"
                  name="expirationDate"
                  type="date"
                  min={getMinDate()}
                  value={plateletsForm.expirationDate}
                  onChange={handlePlateletsChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platelets-bloodType">Blood Type</Label>
                  <Select
                    name="bloodType"
                    value={plateletsForm.bloodType}
                    onValueChange={(value) => setPlateletsForm((prev) => ({ ...prev, bloodType: value }))}
                    required
                  >
                    <SelectTrigger id="platelets-bloodType">
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
                  <RadioGroup value={plateletsForm.rh} onValueChange={handleRhChange} className="flex space-x-4">
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
                {isLoading ? "Adding..." : "Add Platelets Bag"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
