import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { AppError, ErrorType, logError } from "@/lib/error-handling"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "Not authenticated",
          type: ErrorType.AUTHENTICATION,
        },
        { status: 401 },
      )
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      adminId: session.adminId,
      hospitalId: session.hospitalId,
    })
  } catch (error) {
    console.error("Check session API error:", error)

    // Handle different error types
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: error.message,
          type: error.type,
        },
        { status: error.type === ErrorType.AUTHENTICATION ? 401 : 500 },
      )
    }

    // Handle unexpected errors
    const appError = logError(error, "Check Session API")
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "Internal server error",
        type: ErrorType.SERVER,
        message: appError.message,
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  // This endpoint is used to extend the session
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "Not authenticated",
          type: ErrorType.AUTHENTICATION,
        },
        { status: 401 },
      )
    }

    // Session is valid, return success
    // Note: The session cookie's expiration is automatically extended
    // when the request is made due to how cookies work
    return NextResponse.json({
      success: true,
      authenticated: true,
      message: "Session extended",
    })
  } catch (error) {
    console.error("Extend session API error:", error)

    // Handle different error types
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: error.message,
          type: error.type,
        },
        { status: error.type === ErrorType.AUTHENTICATION ? 401 : 500 },
      )
    }

    // Handle unexpected errors
    const appError = logError(error, "Extend Session API")
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "Internal server error",
        type: ErrorType.SERVER,
        message: appError.message,
      },
      { status: 500 },
    )
  }
}
