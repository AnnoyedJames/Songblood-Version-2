"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // In preview mode, accept any login
      if (
        typeof window !== "undefined" &&
        (window.location.hostname.includes("vercel.app") || window.location.hostname.includes("localhost"))
      ) {
        // Simulate a delay for a more realistic experience
        await new Promise((resolve) => setTimeout(resolve, 1000))
        router.push("/dashboard")
        return
      }

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Successful login
        router.push("/dashboard")
      } else {
        // Handle error
        setError(data.message || "Login failed. Please check your credentials.")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">{error}</div>}

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
          placeholder={
            typeof window !== "undefined" &&
            (window.location.hostname.includes("vercel.app") || window.location.hostname.includes("localhost"))
              ? "Any username works in preview mode"
              : ""
          }
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
          placeholder={
            typeof window !== "undefined" &&
            (window.location.hostname.includes("vercel.app") || window.location.hostname.includes("localhost"))
              ? "Any password works in preview mode"
              : ""
          }
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin h-4 w-4 mr-2" /> Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </button>

      {typeof window !== "undefined" &&
        (window.location.hostname.includes("vercel.app") || window.location.hostname.includes("localhost")) && (
          <div className="mt-2 text-xs text-center text-amber-600">
            Preview mode: Any username and password will work
          </div>
        )}
    </form>
  )
}
