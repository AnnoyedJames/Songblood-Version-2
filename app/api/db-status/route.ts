import { NextResponse } from "next/server"
import { testDatabaseConnection, getConnectionErrorMessage } from "@/lib/db"

// Force dynamic rendering for API routes
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Test the database connection
    const { connected, error } = await testDatabaseConnection()

    // Return a successful response even if the database is not connected
    return NextResponse.json({
      connected,
      message: connected
        ? "Database connected successfully"
        : error || getConnectionErrorMessage() || "Unable to connect to database",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV || "unknown",
    })
  } catch (error) {
    console.error("Database status check error:", error)

    // Return a response with the error details
    return NextResponse.json({
      connected: false,
      message: error instanceof Error ? error.message : "Unknown error during database status check",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV || "unknown",
    })
  }
}
