import { NextResponse } from "next/server"
import { testDatabaseConnection, getConnectionErrorMessage } from "@/lib/db"

// Force dynamic rendering for API routes
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Test the database connection
    const { connected, error } = await testDatabaseConnection()

    return NextResponse.json({
      connected,
      error: error || getConnectionErrorMessage() || undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database status check error:", error)

    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
