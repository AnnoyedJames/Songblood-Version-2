import { NextResponse } from "next/server"
import { register } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { username, password, hospitalId } = await request.json()

    if (!username || !password || !hospitalId) {
      return NextResponse.json(
        {
          success: false,
          error: "Username, password, and hospital ID are required",
        },
        { status: 400 },
      )
    }

    try {
      const result = await register(username, password, hospitalId)
      return NextResponse.json(result, { status: result.success ? 200 : 400 })
    } catch (error) {
      console.error("Registration error:", error)
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
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
