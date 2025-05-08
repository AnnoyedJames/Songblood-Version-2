import { NextResponse } from "next/server"
import { searchDonors } from "@/lib/db"
import { cookies } from "next/headers"
import { AppError, ErrorType, logError } from "@/lib/error-handling"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Get session
    const cookieStore = cookies()
    const adminId = cookieStore.get("adminId")?.value
    const hospitalId = cookieStore.get("hospitalId")?.value

    if (!adminId || !hospitalId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          type: ErrorType.AUTHENTICATION,
        },
        { status: 401 },
      )
    }

    // Get search query and filter parameters
    const url = new URL(request.url)
    const query = url.searchParams.get("q") || ""
    const showInactive = url.searchParams.get("showInactive") === "true"

    // Search donors
    const results = await searchDonors(query, showInactive)

    return NextResponse.json({ success: true, results })
  } catch (error) {
    // Handle different error types
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          type: error.type,
        },
        { status: error.type === ErrorType.AUTHENTICATION ? 401 : 500 },
      )
    }

    // Handle unexpected errors
    const appError = logError(error, "Search API")
    return NextResponse.json(
      {
        success: false,
        error: appError.message,
        type: appError.type,
      },
      { status: 500 },
    )
  }
}
