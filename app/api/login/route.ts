import { NextResponse } from "next/server"
import { login } from "@/lib/auth"
import { AppError, ErrorType, logError } from "@/lib/error-handling"
import { getConnectionErrorMessage } from "@/lib/db-connection"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Username and password are required",
          type: ErrorType.VALIDATION,
        },
        { status: 400 },
      )
    }

    try {
      const result = await login(username, password)
      return NextResponse.json(result, { status: 200 })
    } catch (error) {
      // Check if this is a database connection error
      if (error instanceof AppError && error.type === ErrorType.DATABASE_CONNECTION) {
        // Return a specific error for database connection issues
        return NextResponse.json(
          {
            success: false,
            error: "Database connection error: " + getConnectionErrorMessage(),
            type: ErrorType.DATABASE_CONNECTION,
          },
          { status: 503 },
        )
      }

      throw error
    }
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
    const appError = logError(error, "Login API")
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
