"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function FallbackLogin() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleDemoLogin() {
    setIsLoading(true)
    setError("")

    try {
      // Try to use the API first
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: "demo", password: "demo" }),
        })

        const data = await response.json()

        if (data.success) {
          router.push("/dashboard")
          router.refresh()
          return
        }
      } catch (apiError) {
        console.error("API login failed, falling back to direct cookie:", apiError)
      }

      // If API fails, create a session directly in the browser
      document.cookie = `adminId=1; path=/; max-age=${24 * 60 * 60}`
      document.cookie = `hospitalId=1; path=/; max-age=${24 * 60 * 60}`
      document.cookie = `fallbackMode=true; path=/; max-age=${24 * 60 * 60}`
      document.cookie = `adminUsername=demo; path=/; max-age=${24 * 60 * 60}`
      document.cookie = `adminPassword=demo; path=/; max-age=${24 * 60 * 60}`

      // Redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      console.error("Demo login error:", err)
      setError("Failed to create demo session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mt-4 bg-gray-50 border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Database Connection Issues?</CardTitle>
        <CardDescription>Use the demo login for testing purposes</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button variant="outline" className="w-full" onClick={handleDemoLogin} disabled={isLoading}>
          {isLoading ? "Creating Demo Session..." : "Continue with Demo Account"}
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          This will create a temporary session for demonstration purposes.
        </p>
      </CardContent>
    </Card>
  )
}
