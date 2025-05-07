"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function LoginForm({ returnTo = "" }: { returnTo?: string }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isPreview, setIsPreview] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Check if we're in a preview environment
  useEffect(() => {
    const checkPreviewEnv = () => {
      const isPreviewEnv =
        window.location.hostname.includes("vercel.app") ||
        window.location.hostname.includes("localhost") ||
        window.location.hostname.includes("vusercontent.net")

      setIsPreview(isPreviewEnv)

      if (isPreviewEnv) {
        console.log("Running in preview environment")
        // Pre-fill demo credentials in preview
        setUsername("demo")
        setPassword("demo")
      }
    }

    checkPreviewEnv()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      // Clone the response to avoid the "body stream already read" error
      // when we need to read the body in different formats
      const responseClone = response.clone()

      // Check if the response is ok
      if (!response.ok) {
        // Try to parse as JSON first
        try {
          const errorData = await response.json()

          // Handle JSON error responses
          if (errorData.type === "DATABASE_CONNECTION") {
            setError("Database connection error. Please try again later.")

            // Special handling for preview environments
            if (isPreview && (username === "demo" || username === "admin")) {
              toast({
                title: "Preview Mode",
                description: "Using demo login for preview environment.",
              })

              // Redirect to dashboard in preview mode
              router.push("/dashboard")
              return
            }

            toast({
              title: "Connection Error",
              description: "Unable to connect to the database. Please try again later.",
              variant: "destructive",
            })
          } else if (errorData.type === "AUTHENTICATION") {
            setError("Invalid username or password")
            toast({
              title: "Authentication Failed",
              description: "Invalid username or password. Please try again.",
              variant: "destructive",
            })
          } else {
            setError(errorData.error || "An error occurred during login")
            toast({
              title: "Login Error",
              description: errorData.error || "An error occurred during login. Please try again.",
              variant: "destructive",
            })
          }
        } catch (jsonError) {
          // If JSON parsing fails, use the status text or a generic message
          // Use the cloned response to read as text
          const errorText = await responseClone.text()
          console.error("Non-JSON error response:", errorText)

          setError(`Server error: ${response.status} ${response.statusText || "Unknown error"}`)

          // Special handling for preview environments
          if (isPreview && (username === "demo" || username === "admin")) {
            toast({
              title: "Preview Mode",
              description: "Using demo login for preview environment.",
            })

            // Redirect to dashboard in preview mode
            router.push("/dashboard")
            return
          }

          toast({
            title: "Login Error",
            description: "The server returned an invalid response. Please try again later.",
            variant: "destructive",
          })
        }
        return
      }

      // For successful responses, parse JSON
      try {
        const data = await response.json()

        // Login successful
        toast({
          title: "Login Successful",
          description: "You have been logged in successfully.",
        })

        // Redirect to the return URL or dashboard
        if (returnTo) {
          const decodedReturnTo = decodeURIComponent(returnTo)
          // Validate the returnTo URL to prevent open redirect vulnerabilities
          if (decodedReturnTo.startsWith("/") && !decodedReturnTo.includes("//")) {
            router.push(decodedReturnTo)
            return
          }
        }

        router.push("/dashboard")
      } catch (jsonError) {
        console.error("Error parsing successful response:", jsonError)
        setError("Received an invalid response from the server")

        // Special handling for preview environments
        if (isPreview && (username === "demo" || username === "admin")) {
          toast({
            title: "Preview Mode",
            description: "Using demo login for preview environment.",
          })

          // Redirect to dashboard in preview mode
          router.push("/dashboard")
          return
        }

        toast({
          title: "Login Error",
          description: "The server returned an invalid response. Please try again later.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")

      // Special handling for preview environments
      if (isPreview && (username === "demo" || username === "admin")) {
        toast({
          title: "Preview Mode",
          description: "Using demo login for preview environment.",
        })

        // Redirect to dashboard in preview mode
        router.push("/dashboard")
        return
      }

      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your internet connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      {isPreview && (
        <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm">
          <p className="font-medium text-blue-800">Preview Environment</p>
          <p className="text-blue-700">Using demo credentials for preview. Username: "demo", Password: "demo"</p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isLoading}
          placeholder="Enter your username"
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
          disabled={isLoading}
          placeholder="Enter your password"
        />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  )
}
