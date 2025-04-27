import { NextResponse } from "next/server"
import { login } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Username and password are required",
        },
        { status: 400 },
      )
    }

    try {
      const result = await login(username, password)
      return NextResponse.json(result, { status: result.success ? 200 : 401 })
    } catch (error: any) {
      console.error("Login error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Database connection error. Please try again later.",
          isDbError: true,
        },
        { status: 503 },
      )
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
