import { NextResponse } from "next/server"
import { testDatabaseConnection, isFallbackMode, getConnectionErrorMessage } from "@/lib/db"

export async function GET() {
  try {
    // Test the database connection
    const { connected, error } = await testDatabaseConnection()

    return NextResponse.json({
      connected,
      fallbackMode: isFallbackMode(),
      error: error || getConnectionErrorMessage() || undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database status check error:", error)

    return NextResponse.json({
      connected: false,
      fallbackMode: true,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
