"use client"

import type React from "react"

import { useState } from "react"
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
  const router = useRouter()
  const { toast } = useToast()

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

      const data = await response.json()

      if (!response.ok) {
        if (data.type === "DATABASE_CONNECTION") {
          setError("Database connection error. Please try again later.")
          toast({
            title: "Connection Error",
            description: "Unable to connect to the database. Please try again later.",
            variant: "destructive",
          })
        } else if (data.type === "AUTHENTICATION") {
          setError("Invalid username or password")
          toast({
            title: "Authentication Failed",
            description: "Invalid username or password. Please try again.",
            variant: "destructive",
          })
        } else {
          setError(data.error || "An error occurred during login")
          toast({
            title: "Login Error",
            description: data.error || "An error occurred during login. Please try again.",
            variant: "destructive",
          })
        }
        return
      }

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
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
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
