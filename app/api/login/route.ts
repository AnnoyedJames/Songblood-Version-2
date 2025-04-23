import { NextResponse } from "next/server"
import { login } from "@/lib/auth"
import { isFallbackMode } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    try {
      const result = await login(username, password)

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            fallbackMode: isFallbackMode(),
          },
          { status: 401 },
        )
      }

      return NextResponse.json({
        success: true,
        fallbackMode: isFallbackMode(),
      })
    } catch (dbError: any) {
      console.error("Database error during login:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Database connection error. Please try again later.",
          fallbackMode: true,
        },
        { status: 503 },
      )
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
        fallbackMode: true,
      },
      { status: 500 },
    )
  }
}
