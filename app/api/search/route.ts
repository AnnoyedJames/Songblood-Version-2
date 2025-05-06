import { NextResponse } from "next/server"
import { searchDonors } from "@/lib/db"
import { getSessionData } from "@/lib/session-utils"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const showInactive = searchParams.get("showInactive") === "true"

    // Validate query parameter
    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    // Get session data to check if user is authenticated
    const session = await getSessionData()
    if (!session || !session.isLoggedIn) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Search for donors
    const results = await searchDonors(query, showInactive)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error in search API:", error)

    return NextResponse.json({ error: "Failed to search donors. Please try again later." }, { status: 500 })
  }
}
