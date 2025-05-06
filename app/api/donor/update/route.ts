import { NextResponse } from "next/server"
import { updateBloodEntry } from "@/lib/db-diagnostics"
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
    const { bagId, entryType, donorName, amount, expirationDate } = body

    // Validate required fields
    if (!bagId || !entryType || !donorName || !amount || !expirationDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update the entry
    const result = await updateBloodEntry({
      bagId,
      entryType,
      donorName,
      amount,
      expirationDate,
      hospitalId: session.hospitalId,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to update entry" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update donor API:", error)

    return NextResponse.json({ error: "Failed to update entry. Please try again later." }, { status: 500 })
  }
}
