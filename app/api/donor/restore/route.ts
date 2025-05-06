import { NextResponse } from "next/server"
import { restoreBloodEntry } from "@/lib/db-diagnostics"
import { getSessionData } from "@/lib/session-utils"

export async function POST(request: Request) {
  try {
    // Get session data to check if user is authenticated
    const session = await getSessionData()
    if (!session || !session.isLoggedIn) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { bagId, entryType } = body

    // Validate required fields
    if (!bagId || !entryType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Restore the entry
    const result = await restoreBloodEntry(bagId, entryType, session.hospitalId)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to restore entry" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in restore donor API:", error)

    return NextResponse.json({ error: "Failed to restore entry. Please try again later." }, { status: 500 })
  }
}
