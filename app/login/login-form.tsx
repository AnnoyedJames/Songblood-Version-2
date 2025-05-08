"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { ErrorType } from "@/lib/error-handling"

interface LoginFormProps {
  returnTo?: string
}

export default function LoginForm({ returnTo }: LoginFormProps) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [errorType, setErrorType] = useState<ErrorType | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setErrorType(null)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || "Login failed. Please check your credentials.")
        setErrorType(data.type || ErrorType.AUTHENTICATION)
        setIsLoading(false)
        return
      }

      // If login is successful and we have a returnTo URL, navigate there
      if (returnTo) {
        const decodedReturnTo = decodeURIComponent(returnTo)
        // Validate the returnTo URL to prevent open redirect vulnerabilities
        if (decodedReturnTo.startsWith("/") && !decodedReturnTo.includes("//")) {
          router.push(decodedReturnTo)
          return
        }
      }

      // Otherwise go to dashboard
      router.push("/dashboard")
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
      setErrorType(ErrorType.SERVER)
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {error && (
          <Alert variant={errorType === ErrorType.DATABASE_CONNECTION ? "warning" : "destructive"} className="mb-4">
            <AlertCircle className="h-4 w-4" />
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
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
