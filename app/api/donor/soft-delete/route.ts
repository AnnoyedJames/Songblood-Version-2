import { NextResponse } from "next/server"
import { deleteBloodEntry } from "@/lib/db-diagnostics"
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

    // Soft delete the entry
    const result = await deleteBloodEntry(bagId, entryType, session.hospitalId)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete entry" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in soft delete donor API:", error)

    return NextResponse.json({ error: "Failed to delete entry. Please try again later." }, { status: 500 })
  }
}
