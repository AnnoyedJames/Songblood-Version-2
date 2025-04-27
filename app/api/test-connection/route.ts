import { NextResponse } from "next/server"
import { testDatabaseConnectionWithoutCache } from "@/lib/db-test"

export async function GET() {
  try {
    const result = await testDatabaseConnectionWithoutCache()

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database test connection error:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
