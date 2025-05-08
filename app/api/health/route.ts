import { NextResponse } from "next/server"
import { testDatabaseConnection } from "@/lib/db"
import { getVercelEnv } from "@/lib/env"

export async function GET() {
  try {
    // Test database connection
    const dbStatus = await testDatabaseConnection()

    // Get environment information
    const vercelEnv = getVercelEnv()
    const nodeEnv = process.env.NODE_ENV || "development"

    // Collect health information
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: {
        vercel: vercelEnv,
        node: nodeEnv,
      },
      database: {
        connected: dbStatus.connected,
        error: dbStatus.error || null,
      },
      build: {
        version: process.env.NEXT_PUBLIC_BUILD_ID || "unknown",
      },
    }

    // Return health status
    return NextResponse.json(health)
  } catch (error) {
    console.error("Health check error:", error)

    // Return error response
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
