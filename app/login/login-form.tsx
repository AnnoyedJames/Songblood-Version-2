"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ServerCrash, Info } from "lucide-react"

export default function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isServerError, setIsServerError] = useState(false)
  const [isFallbackMode, setIsFallbackMode] = useState(false)
  const [connectionChecked, setConnectionChecked] = useState(false)

  // Check database connection on component mount
  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch("/api/check-connection")
        const data = await response.json()
        setIsFallbackMode(data.fallbackMode)
      } catch (err) {
        console.error("Connection check error:", err)
        setIsFallbackMode(true)
      } finally {
        setConnectionChecked(true)
      }
    }

    checkConnection()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsServerError(false)
    setIsLoading(true)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.fallbackMode) {
          setIsFallbackMode(true)
        }
        router.push("/dashboard")
        router.refresh()
      } else {
        setError(data.error || "Login failed. Please try again.")
        setIsServerError(response.status >= 500)
        if (data.fallbackMode) {
          setIsFallbackMode(true)
        }
      }
    } catch (err) {
      console.error("Login fetch error:", err)
      setError("Connection error. Please check your network and try again.")
      setIsServerError(true)
      setIsFallbackMode(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Login</CardTitle>
        <CardDescription>Enter your credentials to access the admin portal</CardDescription>
      </CardHeader>
      <CardContent>
        {isFallbackMode && connectionChecked && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700">
              Database connection unavailable. Using demo mode with sample data.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant={isServerError ? "destructive" : "default"} className="mb-4">
            {isServerError ? <ServerCrash className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground text-center">
          {isFallbackMode
            ? "Demo mode: Username: demo, Password: demo"
            : "Example: Username: Panya, Password: P9aDhR8e"}
        </p>
        {isServerError && (
          <p className="text-xs text-muted-foreground text-center">
            Database connection issues detected. Using fallback authentication.
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
