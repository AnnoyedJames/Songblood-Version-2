import { NextResponse } from "next/server"
import { clearSession } from "@/lib/auth"
import { AppError, ErrorType, logError } from "@/lib/error-handling"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    await clearSession()

    return NextResponse.json({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout API error:", error)

    // Handle different error types
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          type: error.type,
        },
        { status: 500 },
      )
    }

    // Handle unexpected errors
    const appError = logError(error, "Logout API")
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        type: ErrorType.SERVER,
        message: appError.message,
      },
      { status: 500 },
    )
  }
}
