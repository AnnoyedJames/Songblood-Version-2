"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function RunMigrationButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/diagnostics/run-migration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          migrationFile: "create-surplus-tables.sql",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to run migration")
      }

      setIsSuccess(true)
      toast({
        title: "Migration Successful",
        description: "The surplus_transfers table has been created successfully.",
        variant: "default",
      })

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Migration error:", error)
      toast({
        title: "Migration Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={runMigration}
      disabled={isLoading || isSuccess}
      variant={isSuccess ? "outline" : "default"}
      className="mt-4"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Running Migration...
        </>
      ) : isSuccess ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Migration Complete
        </>
      ) : (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Run Database Migration
        </>
      )}
    </Button>
  )
}
