import { NextResponse } from "next/server"
import { login } from "@/lib/auth"
import { AppError, ErrorType, logError } from "@/lib/error-handling"
import { getConnectionErrorMessage } from "@/lib/db"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    // Check for preview environment first
    const isPreviewEnv =
      process.env.VERCEL_ENV === "preview" ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
      process.env.NODE_ENV === "development"

    console.log(
      `Environment: ${process.env.NODE_ENV}, VERCEL_ENV: ${process.env.VERCEL_ENV}, NEXT_PUBLIC_VERCEL_ENV: ${process.env.NEXT_PUBLIC_VERCEL_ENV}`,
    )
    console.log(`Is preview environment: ${isPreviewEnv}`)

    // Parse the request body
    let username, password
    try {
      const body = await request.json()
      username = body.username
      password = body.password
      console.log(`Login attempt for username: ${username}`)
    } catch (error) {
      console.error("Error parsing request body:", error)
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
      console.log("Missing username or password")
      return NextResponse.json(
        {
          success: false,
          error: "Username and password are required",
          type: ErrorType.VALIDATION,
        },
        { status: 400 },
      )
    }

    // Special handling for preview environments - most direct approach
    if (isPreviewEnv) {
      console.log("[Preview Mode] Processing login in preview environment API")

      // Allow specific credentials in preview
      if ((username === "demo" && password === "demo") || (username === "admin" && password === "password")) {
        console.log("[Preview Mode] Creating preview session in API")

        // Create a session for the preview user
        const response = NextResponse.json({ success: true, previewMode: true }, { status: 200 })

        // Set cookies directly in the response
        response.cookies.set("adminId", "1", {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        })

        response.cookies.set("hospitalId", "1", {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        })

        // Also set the username and password cookies for API calls
        response.cookies.set("adminUsername", username, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        })

        response.cookies.set("adminPassword", password, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        })

        return response
      } else {
        console.log("[Preview Mode] Invalid credentials for preview in API")
        return NextResponse.json(
          {
            success: false,
            error: "Invalid credentials",
            type: ErrorType.AUTHENTICATION,
          },
          { status: 401 },
        )
      }
    }

    // Non-preview environment - normal flow
    try {
      console.log("Calling login function")
      const result = await login(username, password)
      return NextResponse.json(result, { status: 200 })
    } catch (error) {
      console.error("Error during login:", error)

      // Check if this is a database connection error
      if (error instanceof AppError && error.type === ErrorType.DATABASE_CONNECTION) {
        console.error("Database connection error during login:", error)

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
