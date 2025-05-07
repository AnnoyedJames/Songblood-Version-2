import { NextResponse } from "next/server"
import { login } from "@/lib/auth"
import { AppError, ErrorType, logError } from "@/lib/error-handling"
import { getConnectionErrorMessage } from "@/lib/db"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

// Flag to determine if we're in a preview environment
const isPreviewEnvironment =
  process.env.VERCEL_ENV === "preview" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
  process.env.NODE_ENV === "development"

export async function POST(request: Request) {
  try {
    // Parse the request body
    let username, password
    try {
      const body = await request.json()
      username = body.username
      password = body.password
    } catch (error) {
      // Handle JSON parsing errors in the request
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          type: ErrorType.VALIDATION,
        },
        { status: 400 },
      )
    }

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

    // Special handling for preview environments
    if (isPreviewEnvironment) {
      console.log("Processing login in preview environment")

      // Allow demo credentials in preview
      if ((username === "demo" && password === "demo") || (username === "admin" && password === "password")) {
        console.log("Using demo login for preview")

        // Create a session for the demo user
        const demoSession = {
          adminId: 1,
          hospitalId: 1,
        }

        // Set cookies for the demo session
        const response = NextResponse.json({ success: true }, { status: 200 })
        response.cookies.set("adminId", "1", {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        })
        response.cookies.set("hospitalId", "1", {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        })

        return response
      }
    }

    try {
      const result = await login(username, password)
      return NextResponse.json(result, { status: 200 })
    } catch (error) {
      // Check if this is a database connection error
      if (error instanceof AppError && error.type === ErrorType.DATABASE_CONNECTION) {
        console.error("Database connection error during login:", error)

        // Special handling for preview environments
        if (isPreviewEnvironment) {
          console.log("Providing preview fallback for database error")

          // In preview, we'll allow a special login despite DB errors
          if ((username === "demo" && password === "demo") || (username === "admin" && password === "password")) {
            console.log("Using fallback login for preview with DB error")

            // Create a session for the demo user
            const response = NextResponse.json({ success: true }, { status: 200 })
            response.cookies.set("adminId", "1", {
              httpOnly: true,
              maxAge: 24 * 60 * 60 * 1000, // 1 day
            })
            response.cookies.set("hospitalId", "1", {
              httpOnly: true,
              maxAge: 24 * 60 * 60 * 1000, // 1 day
            })

            return response
          }
        }

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

      // Handle other specific error types
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

      // For any other errors, return a generic error response
      throw error
    }
  } catch (error) {
    // Handle unexpected errors
    console.error("Unhandled error in login API:", error)
    const appError = logError(error, "Login API")
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
