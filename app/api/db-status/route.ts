import { NextResponse } from "next/server"
import { testDatabaseConnection, getConnectionErrorMessage } from "@/lib/db"
import { isPreviewEnvironment } from "@/lib/db-config"

// Force dynamic rendering for API routes
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // In preview mode, always return success
    if (isPreviewEnvironment()) {
      return NextResponse.json({
        connected: true,
        message: "Preview mode: Using mock data (no database connection required)",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "unknown",
        vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV || "unknown",
        isPreview: true,
      })
    }

    // Test the database connection
    const { connected, error } = await testDatabaseConnection()

    // Return a response with the connection status
    return NextResponse.json({
      connected,
      message: connected
        ? "Database connected successfully"
        : error || getConnectionErrorMessage() || "Unable to connect to database",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV || "unknown",
      isPreview: false,
    })
  } catch (error) {
    console.error("Database status check error:", error)

    // Ensure we always return a valid JSON response even when errors occur
    return NextResponse.json(
      {
        connected: false,
        message: error instanceof Error ? error.message : "Unknown error during database status check",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "unknown",
        vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV || "unknown",
        isPreview: false,
        error: true,
      },
      { status: 500 },
    )
  }
}
