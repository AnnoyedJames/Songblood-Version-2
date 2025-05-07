"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Info } from "lucide-react"

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [detailedError, setDetailedError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDetailedError(null)
    setDebugInfo(null)
    setLoading(true)

    try {
      console.log("Submitting login form with username:", username)

      // Regular login flow
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      // Add debugging to see the response
      console.log("Login response status:", response.status)
      console.log("Login response data:", data)

      // Store debug info
      setDebugInfo({
        status: response.status,
        statusText: response.statusText,
        data,
        timestamp: new Date().toISOString(),
      })

      if (!response.ok) {
        // Show a user-friendly error message
        setError(data.error || "Login failed")

        // Store detailed error for debugging
        if (data.details) {
          setDetailedError(data.details)
        }

        return
      }

      // Redirect to dashboard on successful login
      router.push("/dashboard")
    } catch (err) {
      console.error("Login error:", err)
      setError("Connection error. Please try again.")
      setDetailedError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {detailedError && (
            <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-200 overflow-auto">
              <p className="font-semibold">Detailed Error:</p>
              <p>{detailedError}</p>
            </div>
          )}

          {debugInfo && (
            <div className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-auto">
              <p className="font-semibold flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Debug Information:
              </p>
              <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
