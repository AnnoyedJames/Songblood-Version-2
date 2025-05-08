"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Database, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function InitDbButton() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleInitDb = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/init-db", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Database initialized successfully",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to initialize database",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleInitDb} disabled={loading} variant="outline" size="sm" className="text-gray-500">
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          Initializing...
        </>
      ) : (
        <>
          <Database className="h-4 w-4 mr-1" />
          Initialize Database
        </>
      )}
    </Button>
  )
}
