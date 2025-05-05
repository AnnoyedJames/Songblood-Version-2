"use client"

import type React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ErrorType } from "@/lib/error-handling"
import { useSessionTimeout } from "@/lib/session-timeout"
// Import our custom hook
import { useToastNotification } from "@/lib/hooks/use-toast-notification"

type AddEntryFormProps = {
  hospitalId: number
}

// Define specific error types for the add entry system
type ApiErrorResponse = {
  success: boolean
  error: string
  type?: ErrorType
  details?: string
  validationErrors?: Record<string, string>
  retryable?: boolean
}

export default function AddEntryForm({ hospitalId }: AddEntryFormProps) {
  const router = useRouter()
  // Replace:
  // const { toast } = useToast()
  // With:
  const { successToast, errorToast, infoToast } = useToastNotification()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [errorType, setErrorType] = useState<ErrorType | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isRetryable, setIsRetryable] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("redblood")
  const formRef = useRef<HTMLFormElement>(null)

  // Red blood cell form state
  const [redBloodForm, setRedBloodForm] = useState({
    donorName: "",
    amount: "",
    expirationDate: "",
    bloodType: "",
    rh: "+",
  })

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

  // Use session timeout hook with form data preservation
  const { saveFormData } = useSessionTimeout({
    onTimeout: () => {
      // Save form data before timeout
      saveFormData(
        activeTab === "redblood" ? "redblood-form" : activeTab === "plasma" ? "plasma-form" : "platelets-form",
      )
    },
  })

  // Save form data periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveFormData(
        activeTab === "redblood" ? "redblood-form" : activeTab === "plasma" ? "plasma-form" : "platelets-form",
      )
    }, 30000) // Save every 30 seconds

    return () => clearInterval(saveInterval)
  }, [activeTab, saveFormData, redBloodForm, plasmaForm, plateletsForm])

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  // Handle red blood cell form change
  const handleRedBloodChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setRedBloodForm((prev) => ({ ...prev, [name]: value }))

    // Clear validation error when field is updated
    if (validationErrors[`redblood-${name}`]) {
      setValidationErrors((prev) => {
        const updated = { ...prev }
        delete updated[`redblood-${name}`]
        return updated
      })
    }
  }

  // Handle red blood cell Rh change
  const handleRedBloodRhChange = (value: string) => {
    setRedBloodForm((prev) => ({ ...prev, rh: value }))

    // Clear validation error when field is updated
    if (validationErrors["redblood-rh"]) {
      setValidationErrors((prev) => {
        const updated = { ...prev }
        delete updated["redblood-rh"]
        return updated
      })
    }
  }

  // Handle plasma form change
  const handlePlasmaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPlasmaForm((prev) => ({ ...prev, [name]: value }))

    // Clear validation error when field is updated
    if (validationErrors[`plasma-${name}`]) {
      setValidationErrors((prev) => {
        const updated = { ...prev }
        delete updated[`plasma-${name}`]
        return updated
      })
    }
  }

  // Handle platelets form change
  const handlePlateletsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPlateletsForm((prev) => ({ ...prev, [name]: value }))

    // Clear validation error when field is updated
    if (validationErrors[`platelets-${name}`]) {
      setValidationErrors((prev) => {
        const updated = { ...prev }
        delete updated[`platelets-${name}`]
        return updated
      })
    }
  }

  // Handle platelets Rh change
  const handlePlateletsRhChange = (value: string) => {
    setPlateletsForm((prev) => ({ ...prev, rh: value }))

    // Clear validation error when field is updated
    if (validationErrors["platelets-rh"]) {
      setValidationErrors((prev) => {
        const updated = { ...prev }
        delete updated["platelets-rh"]
        return updated
      })
    }
  }

  // Client-side validation function
  const validateForm = (formType: "redblood" | "plasma" | "platelets", formData: any): boolean => {
    const newValidationErrors: Record<string, string> = {}
    let isValid = true

    // Common validations for all form types
    if (!formData.donorName.trim()) {
      newValidationErrors[`${formType}-donorName`] = "Donor name is required"
      isValid = false
    } else if (formData.donorName.length < 2) {
      newValidationErrors[`${formType}-donorName`] = "Donor name must be at least 2 characters"
      isValid = false
    }

    if (!formData.amount) {
      newValidationErrors[`${formType}-amount`] = "Amount is required"
      isValid = false
    } else {
      const amount = Number(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        newValidationErrors[`${formType}-amount`] = "Amount must be a positive number"
        isValid = false
      } else if (amount < 100) {
        newValidationErrors[`${formType}-amount`] = "Amount must be at least 100 ml"
        isValid = false
      } else if (amount > 500) {
        newValidationErrors[`${formType}-amount`] = "Amount cannot exceed 500 ml"
        isValid = false
      }
    }

    if (!formData.expirationDate) {
      newValidationErrors[`${formType}-expirationDate`] = "Expiration date is required"
      isValid = false
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const expirationDate = new Date(formData.expirationDate)
      if (expirationDate < today) {
        newValidationErrors[`${formType}-expirationDate`] = "Expiration date cannot be in the past"
        isValid = false
      }
    }

    if (!formData.bloodType) {
      newValidationErrors[`${formType}-bloodType`] = "Blood type is required"
      isValid = false
    }

    // For forms that require Rh factor
    if ((formType === "redblood" || formType === "platelets") && !formData.rh) {
      newValidationErrors[`${formType}-rh`] = "Rh factor is required"
      isValid = false
    }

    setValidationErrors((prev) => ({ ...prev, ...newValidationErrors }))
    return isValid
  }

  // Generic API request handler with retry logic and session handling
  const makeApiRequest = useCallback(
    async (url: string, data: any): Promise<ApiErrorResponse> => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include", // Important for session cookies
        })

        // Check for authentication issues
        if (response.status === 401 || response.status === 403) {
          // Save form data before redirecting
          saveFormData(
            activeTab === "redblood" ? "redblood-form" : activeTab === "plasma" ? "plasma-form" : "platelets-form",
          )

          // Replace this:
          // toast({
          //   title: "Session expired",
          //   description: "Your session has expired. Please log in again.",
          //   variant: "destructive",
          // })
          // With this:
          errorToast("Session expired", "Your session has expired. Please log in again.")

          // Redirect to login with return path
          const returnPath = encodeURIComponent(window.location.pathname)
          window.location.href = `/login?reason=session-timeout&returnTo=${returnPath}`

          return {
            success: false,
            error: "Authentication failed. Please log in again.",
            type: ErrorType.AUTHENTICATION,
            retryable: false,
          }
        }

        const responseData = await response.json()

        if (!response.ok) {
          // Handle HTTP error status codes
          return {
            success: false,
            error: responseData.error || `Server error: ${response.status}`,
            type: responseData.type || ErrorType.SERVER,
            details: responseData.details,
            validationErrors: responseData.validationErrors,
            retryable: response.status >= 500 || response.status === 429, // Server errors and rate limiting are retryable
          }
        }

        if (!responseData.success) {
          // Handle API-level errors
          return {
            success: false,
            error: responseData.error || "Operation failed",
            type: responseData.type,
            details: responseData.details,
            validationErrors: responseData.validationErrors,
            retryable: responseData.retryable || false,
          }
        }

        return { success: true, error: "" }
      } catch (err) {
        // Handle network errors
        console.error("API request error:", err)

        // Check if this might be due to a session timeout
        const isSessionError =
          err instanceof Error &&
          (err.message.includes("unauthorized") ||
            err.message.includes("forbidden") ||
            err.message.includes("not authenticated"))

        if (isSessionError) {
          // Save form data before redirecting
          saveFormData(
            activeTab === "redblood" ? "redblood-form" : activeTab === "plasma" ? "plasma-form" : "platelets-form",
          )

          // Redirect to login with return path
          const returnPath = encodeURIComponent(window.location.pathname)
          window.location.href = `/login?reason=session-timeout&returnTo=${returnPath}`

          return {
            success: false,
            error: "Authentication failed. Please log in again.",
            type: ErrorType.AUTHENTICATION,
            retryable: false,
          }
        }

        return {
          success: false,
          error: "Network error. Please check your connection.",
          type: ErrorType.SERVER,
          retryable: true, // Network errors are typically retryable
        }
      }
    },
    [activeTab, saveFormData, errorToast],
  )

  // Handle red blood cell form submit
  const handleRedBloodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset error states
    setError("")
    setErrorType(null)
    setErrorDetails(null)
    setValidationErrors({})
    setIsRetryable(false)
    setSuccess("")

    // Validate form
    if (!validateForm("redblood", redBloodForm)) {
      return
    }

    setIsLoading(true)

    try {
      const result = await makeApiRequest("/api/add-redblood", {
        ...redBloodForm,
        amount: Number(redBloodForm.amount),
        hospitalId,
      })

      if (result.success) {
        setSuccess("Red blood cell bag added successfully!")
        setRedBloodForm({
          donorName: "",
          amount: "",
          expirationDate: "",
          bloodType: "",
          rh: "+",
        })
        router.refresh()
      } else {
        setError(result.error || "Failed to add red blood cell bag. Please try again.")
        setErrorType(result.type || ErrorType.SERVER)
        setErrorDetails(result.details || null)
        setIsRetryable(result.retryable || false)

        if (result.validationErrors) {
          setValidationErrors(result.validationErrors)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle plasma form submit
  const handlePlasmaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset error states
    setError("")
    setErrorType(null)
    setErrorDetails(null)
    setValidationErrors({})
    setIsRetryable(false)
    setSuccess("")

    // Validate form
    if (!validateForm("plasma", plasmaForm)) {
      return
    }

    setIsLoading(true)

    try {
      const result = await makeApiRequest("/api/add-plasma", {
        ...plasmaForm,
        amount: Number(plasmaForm.amount),
        hospitalId,
      })

      if (result.success) {
        setSuccess("Plasma bag added successfully!")
        setPlasmaForm({
          donorName: "",
          amount: "",
          expirationDate: "",
          bloodType: "",
        })
        router.refresh()
      } else {
        setError(result.error || "Failed to add plasma bag. Please try again.")
        setErrorType(result.type || ErrorType.SERVER)
        setErrorDetails(result.details || null)
        setIsRetryable(result.retryable || false)

        if (result.validationErrors) {
          setValidationErrors(result.validationErrors)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle platelets form submit
  const handlePlateletsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset error states
    setError("")
    setErrorType(null)
    setErrorDetails(null)
    setValidationErrors({})
    setIsRetryable(false)
    setSuccess("")

    // Validate form
    if (!validateForm("platelets", plateletsForm)) {
      return
    }

    setIsLoading(true)

    try {
      const result = await makeApiRequest("/api/add-platelets", {
        ...plateletsForm,
        amount: Number(plateletsForm.amount),
        hospitalId,
      })

      if (result.success) {
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
        setError(result.error || "Failed to add platelets bag. Please try again.")
        setErrorType(result.type || ErrorType.SERVER)
        setErrorDetails(result.details || null)
        setIsRetryable(result.retryable || false)

        if (result.validationErrors) {
          setValidationErrors(result.validationErrors)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle retry
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setError("")
    setErrorType(null)
    setErrorDetails(null)
    setIsRetryable(false)
  }

  // Get min date for expiration (today)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  // Helper function to check if a field has validation error
  const hasError = (fieldName: string): boolean => {
    return !!validationErrors[fieldName]
  }

  // Helper function to get error message for a field
  const getErrorMessage = (fieldName: string): string => {
    return validationErrors[fieldName] || ""
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Entry</CardTitle>
        <CardDescription>Add new blood components to your hospital's inventory</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant={errorType === ErrorType.DATABASE_CONNECTION ? "warning" : "destructive"} className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">{error}</div>
              {errorDetails && <div className="text-sm mt-1">{errorDetails}</div>}
              {isRetryable && (
                <Button variant="outline" size="sm" className="mt-2" onClick={handleRetry}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 text-green-700 bg-green-50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="redblood" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="redblood">Red Blood Cells</TabsTrigger>
            <TabsTrigger value="plasma">Plasma</TabsTrigger>
            <TabsTrigger value="platelets">Platelets</TabsTrigger>
          </TabsList>

          <TabsContent value="redblood">
            <form id="redblood-form" onSubmit={handleRedBloodSubmit} className="space-y-4" ref={formRef}>
              <div className="space-y-2">
                <Label
                  htmlFor="redblood-donorName"
                  className={hasError("redblood-donorName") ? "text-destructive" : ""}
                >
                  Donor Name
                </Label>
                <Input
                  id="redblood-donorName"
                  name="donorName"
                  value={redBloodForm.donorName}
                  onChange={handleRedBloodChange}
                  className={hasError("redblood-donorName") ? "border-destructive" : ""}
                  required
                />
                {hasError("redblood-donorName") && (
                  <p className="text-xs text-destructive">{getErrorMessage("redblood-donorName")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="redblood-amount" className={hasError("redblood-amount") ? "text-destructive" : ""}>
                  Amount (ml)
                </Label>
                <Input
                  id="redblood-amount"
                  name="amount"
                  type="number"
                  min="100"
                  max="500"
                  value={redBloodForm.amount}
                  onChange={handleRedBloodChange}
                  className={hasError("redblood-amount") ? "border-destructive" : ""}
                  required
                />
                {hasError("redblood-amount") ? (
                  <p className="text-xs text-destructive">{getErrorMessage("redblood-amount")}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Valid range: 100-500 ml</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="redblood-expirationDate"
                  className={hasError("redblood-expirationDate") ? "text-destructive" : ""}
                >
                  Expiration Date
                </Label>
                <Input
                  id="redblood-expirationDate"
                  name="expirationDate"
                  type="date"
                  min={getMinDate()}
                  value={redBloodForm.expirationDate}
                  onChange={handleRedBloodChange}
                  className={hasError("redblood-expirationDate") ? "border-destructive" : ""}
                  required
                />
                {hasError("redblood-expirationDate") && (
                  <p className="text-xs text-destructive">{getErrorMessage("redblood-expirationDate")}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="redblood-bloodType"
                    className={hasError("redblood-bloodType") ? "text-destructive" : ""}
                  >
                    Blood Type
                  </Label>
                  <Select
                    name="bloodType"
                    value={redBloodForm.bloodType}
                    onValueChange={(value) => {
                      setRedBloodForm((prev) => ({ ...prev, bloodType: value }))
                      if (validationErrors["redblood-bloodType"]) {
                        setValidationErrors((prev) => {
                          const updated = { ...prev }
                          delete updated["redblood-bloodType"]
                          return updated
                        })
                      }
                    }}
                    required
                  >
                    <SelectTrigger
                      id="redblood-bloodType"
                      className={hasError("redblood-bloodType") ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="O">O</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasError("redblood-bloodType") && (
                    <p className="text-xs text-destructive">{getErrorMessage("redblood-bloodType")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className={hasError("redblood-rh") ? "text-destructive" : ""}>Rh Factor</Label>
                  <RadioGroup value={redBloodForm.rh} onValueChange={handleRedBloodRhChange} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="+" id="redblood-rh-positive" />
                      <Label htmlFor="redblood-rh-positive">Positive (+)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="-" id="redblood-rh-negative" />
                      <Label htmlFor="redblood-rh-negative">Negative (-)</Label>
                    </div>
                  </RadioGroup>
                  {hasError("redblood-rh") && (
                    <p className="text-xs text-destructive">{getErrorMessage("redblood-rh")}</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Red Blood Cell Bag"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="plasma">
            <form id="plasma-form" onSubmit={handlePlasmaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plasma-donorName" className={hasError("plasma-donorName") ? "text-destructive" : ""}>
                  Donor Name
                </Label>
                <Input
                  id="plasma-donorName"
                  name="donorName"
                  value={plasmaForm.donorName}
                  onChange={handlePlasmaChange}
                  className={hasError("plasma-donorName") ? "border-destructive" : ""}
                  required
                />
                {hasError("plasma-donorName") && (
                  <p className="text-xs text-destructive">{getErrorMessage("plasma-donorName")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="plasma-amount" className={hasError("plasma-amount") ? "text-destructive" : ""}>
                  Amount (ml)
                </Label>
                <Input
                  id="plasma-amount"
                  name="amount"
                  type="number"
                  min="100"
                  max="500"
                  value={plasmaForm.amount}
                  onChange={handlePlasmaChange}
                  className={hasError("plasma-amount") ? "border-destructive" : ""}
                  required
                />
                {hasError("plasma-amount") ? (
                  <p className="text-xs text-destructive">{getErrorMessage("plasma-amount")}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Valid range: 100-500 ml</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="plasma-expirationDate"
                  className={hasError("plasma-expirationDate") ? "text-destructive" : ""}
                >
                  Expiration Date
                </Label>
                <Input
                  id="plasma-expirationDate"
                  name="expirationDate"
                  type="date"
                  min={getMinDate()}
                  value={plasmaForm.expirationDate}
                  onChange={handlePlasmaChange}
                  className={hasError("plasma-expirationDate") ? "border-destructive" : ""}
                  required
                />
                {hasError("plasma-expirationDate") && (
                  <p className="text-xs text-destructive">{getErrorMessage("plasma-expirationDate")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="plasma-bloodType" className={hasError("plasma-bloodType") ? "text-destructive" : ""}>
                  Blood Type
                </Label>
                <Select
                  name="bloodType"
                  value={plasmaForm.bloodType}
                  onValueChange={(value) => {
                    setPlasmaForm((prev) => ({ ...prev, bloodType: value }))
                    if (validationErrors["plasma-bloodType"]) {
                      setValidationErrors((prev) => {
                        const updated = { ...prev }
                        delete updated["plasma-bloodType"]
                        return updated
                      })
                    }
                  }}
                  required
                >
                  <SelectTrigger
                    id="plasma-bloodType"
                    className={hasError("plasma-bloodType") ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                  </SelectContent>
                </Select>
                {hasError("plasma-bloodType") && (
                  <p className="text-xs text-destructive">{getErrorMessage("plasma-bloodType")}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Plasma Bag"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="platelets">
            <form id="platelets-form" onSubmit={handlePlateletsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="platelets-donorName"
                  className={hasError("platelets-donorName") ? "text-destructive" : ""}
                >
                  Donor Name
                </Label>
                <Input
                  id="platelets-donorName"
                  name="donorName"
                  value={plateletsForm.donorName}
                  onChange={handlePlateletsChange}
                  className={hasError("platelets-donorName") ? "border-destructive" : ""}
                  required
                />
                {hasError("platelets-donorName") && (
                  <p className="text-xs text-destructive">{getErrorMessage("platelets-donorName")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="platelets-amount" className={hasError("platelets-amount") ? "text-destructive" : ""}>
                  Amount (ml)
                </Label>
                <Input
                  id="platelets-amount"
                  name="amount"
                  type="number"
                  min="100"
                  max="500"
                  value={plateletsForm.amount}
                  onChange={handlePlateletsChange}
                  className={hasError("platelets-amount") ? "border-destructive" : ""}
                  required
                />
                {hasError("platelets-amount") ? (
                  <p className="text-xs text-destructive">{getErrorMessage("platelets-amount")}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Valid range: 100-500 ml</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="platelets-expirationDate"
                  className={hasError("platelets-expirationDate") ? "text-destructive" : ""}
                >
                  Expiration Date
                </Label>
                <Input
                  id="platelets-expirationDate"
                  name="expirationDate"
                  type="date"
                  min={getMinDate()}
                  value={plateletsForm.expirationDate}
                  onChange={handlePlateletsChange}
                  className={hasError("platelets-expirationDate") ? "border-destructive" : ""}
                  required
                />
                {hasError("platelets-expirationDate") && (
                  <p className="text-xs text-destructive">{getErrorMessage("platelets-expirationDate")}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="platelets-bloodType"
                    className={hasError("platelets-bloodType") ? "text-destructive" : ""}
                  >
                    Blood Type
                  </Label>
                  <Select
                    name="bloodType"
                    value={plateletsForm.bloodType}
                    onValueChange={(value) => {
                      setPlateletsForm((prev) => ({ ...prev, bloodType: value }))
                      if (validationErrors["platelets-bloodType"]) {
                        setValidationErrors((prev) => {
                          const updated = { ...prev }
                          delete updated["platelets-bloodType"]
                          return updated
                        })
                      }
                    }}
                    required
                  >
                    <SelectTrigger
                      id="platelets-bloodType"
                      className={hasError("platelets-bloodType") ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="O">O</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasError("platelets-bloodType") && (
                    <p className="text-xs text-destructive">{getErrorMessage("platelets-bloodType")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className={hasError("platelets-rh") ? "text-destructive" : ""}>Rh Factor</Label>
                  <RadioGroup
                    value={plateletsForm.rh}
                    onValueChange={handlePlateletsRhChange}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="+" id="platelets-rh-positive" />
                      <Label htmlFor="platelets-rh-positive">Positive (+)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="-" id="platelets-rh-negative" />
                      <Label htmlFor="platelets-rh-negative">Negative (-)</Label>
                    </div>
                  </RadioGroup>
                  {hasError("platelets-rh") && (
                    <p className="text-xs text-destructive">{getErrorMessage("platelets-rh")}</p>
                  )}
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
