import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { listDeletedEntries } from "@/lib/restore-utils"
import { AppError, ErrorType } from "@/lib/error-handling"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get the hospital ID from the session
    const { hospitalId } = session

    // Get entry type from query params if provided
    const url = new URL(request.url)
    const entryType = url.searchParams.get("type") || undefined

    // Get deleted entries
    const result = await listDeletedEntries(hospitalId, entryType as string | undefined)

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Error listing deleted entries:", error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.type === ErrorType.AUTHENTICATION ? 401 : 400 },
      )
    }

    return NextResponse.json({ success: false, error: "Failed to list deleted entries" }, { status: 500 })
  }
}
