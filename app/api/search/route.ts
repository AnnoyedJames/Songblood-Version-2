import { type NextRequest, NextResponse } from "next/server"
import { searchDonors } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { AppError, ErrorType } from "@/lib/error-handling"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const query = url.searchParams.get("query") || ""
    const showInactive = url.searchParams.get("showInactive") === "true"

    // Log the search request for debugging
    console.log(`Search request: query="${query}", showInactive=${showInactive}`)

    // Check authentication
    await requireAuth()

    // Search for donors
    const results = await searchDonors(query, showInactive)

    // Return the results
    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error in search API:", error)

    // Handle specific error types
    if (error instanceof AppError) {
      if (error.type === ErrorType.AUTHENTICATION) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      } else if (error.type === ErrorType.DATABASE_CONNECTION) {
        return NextResponse.json({ error: "Database connection error" }, { status: 503 })
      }
    }

    // Default error response
    return NextResponse.json({ error: "Failed to search donors" }, { status: 500 })
  }
}
