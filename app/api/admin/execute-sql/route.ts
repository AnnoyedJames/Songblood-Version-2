import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// WARNING: This endpoint should be disabled in production
// It's only for development/debugging purposes

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "This endpoint is disabled in production" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { query } = body

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Execute the query
    // WARNING: This is potentially dangerous as it allows arbitrary SQL execution
    // Only use for debugging and ensure it's properly secured in production
    const result = await sql([query] as any)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error("Error executing SQL:", error)
    return NextResponse.json(
      {
        error: "Failed to execute SQL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
