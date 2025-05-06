import { NextResponse } from "next/server"
import { testDatabaseConnection } from "@/lib/db"

export async function GET() {
  try {
    const result = await testDatabaseConnection()

    return NextResponse.json({
      connected: result.connected,
      error: result.error || null,
    })
  } catch (error) {
    console.error("Error in check-connection API route:", error)

    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error checking database connection",
      },
      { status: 500 },
    )
  }
}
