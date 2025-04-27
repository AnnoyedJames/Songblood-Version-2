import { NextResponse } from "next/server"
import { register } from "@/lib/auth"

// Force dynamic rendering for API routes
export const dynamic = "force-dynamic"

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

    const result = await register(username, password, hospitalId)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
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
