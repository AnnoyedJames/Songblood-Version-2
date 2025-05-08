import { NextResponse } from "next/server"
import { testDatabaseConnectionWithoutCache } from "@/lib/db-test"
import { DB_CONFIG } from "@/lib/db-config"

// Force dynamic rendering for API routes
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log(`Testing database connection with ${DB_CONFIG.CONNECTION_TIMEOUT_MS / 1000}s timeout...`)

    const result = await testDatabaseConnectionWithoutCache()

    return NextResponse.json({
      ...result,
      timeout: `${DB_CONFIG.CONNECTION_TIMEOUT_MS / 1000} seconds`,
      maxConnectionTime: `${DB_CONFIG.MAX_CONNECTION_TIME_MS / 1000} seconds`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database test connection error:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        timeout: `${DB_CONFIG.CONNECTION_TIMEOUT_MS / 1000} seconds`,
        maxConnectionTime: `${DB_CONFIG.MAX_CONNECTION_TIME_MS / 1000} seconds`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
