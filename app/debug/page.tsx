import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { isPreviewEnvironment } from "@/lib/env-utils"

export const metadata = {
  title: "Debug | Blood Bank",
  description: "Debug tools for the Blood Bank Management System",
}

export default function DebugPage() {
  const isPreview = isPreviewEnvironment()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Debug Tools</h1>
          <p className="text-gray-600 mt-2">
            Environment: {process.env.NODE_ENV} {isPreview && "(Preview)"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug</CardTitle>
            <CardDescription>Test and debug authentication functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
              <p className="font-medium">Debug Information</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Preview Mode: {isPreview ? "Yes" : "No"}</li>
                <li>NODE_ENV: {process.env.NODE_ENV}</li>
                <li>VERCEL_ENV: {process.env.VERCEL_ENV || "Not set"}</li>
              </ul>
            </div>

            <Suspense fallback={<div>Loading database status...</div>}>
              <DatabaseStatus />
            </Suspense>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

async function DatabaseStatus() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/debug/db`, {
      cache: "no-store",
    })
    const data = await response.json()

    if (!response.ok) {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          <p className="font-medium">Database Error</p>
          <p>{data.error || "Unknown error"}</p>
        </div>
      )
    }

    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
        <p className="font-medium">Database Status: Connected</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Server Time: {new Date(data.time).toLocaleString()}</li>
          <li>Admins: {data.tables.admins.count}</li>
          <li>Sessions: {data.tables.admin_sessions.count}</li>
          <li>Hospitals: {data.tables.hospitals.count}</li>
        </ul>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
        <p className="font-medium">Error Checking Database</p>
        <p>{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    )
  }
}
