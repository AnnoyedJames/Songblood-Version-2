import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { AppError, ErrorType } from "@/lib/error-handling"

export async function GET() {
  try {
    // Verify authentication
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Return the hospital ID from the session
    return NextResponse.json({ success: true, hospitalId: session.hospitalId })
  } catch (error) {
    console.error("Error getting current hospital:", error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.type === ErrorType.AUTHENTICATION ? 401 : 500 },
      )
    }

    return NextResponse.json({ success: false, error: "Failed to get current hospital" }, { status: 500 })
  }
}
