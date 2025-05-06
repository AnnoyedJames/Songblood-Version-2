"use client"

import { Button } from "@/components/ui/button"
import { ServerCrash } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ServerCrash className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-gray-600">We apologize for the inconvenience</p>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <Button onClick={() => reset()} className="gap-2">
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
