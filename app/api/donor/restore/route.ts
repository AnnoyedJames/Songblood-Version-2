import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { restoreBloodEntry } from "@/lib/db-diagnostics"
import { AppError, ErrorType } from "@/lib/error-handling"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get the hospital ID from the session
    const { hospitalId } = session

    // Parse the request body
    const { bagId, entryType } = await request.json()

    // Validate the parameters
    if (!bagId || !entryType) {
      return NextResponse.json({ success: false, error: "Bag ID and entry type are required" }, { status: 400 })
    }

    // Restore the entry
    const result = await restoreBloodEntry(bagId, entryType, hospitalId)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Error restoring blood entry:", error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.type === ErrorType.AUTHENTICATION ? 401 : 400 },
      )
    }

    return NextResponse.json({ success: false, error: "Failed to restore blood entry" }, { status: 500 })
  }
}
