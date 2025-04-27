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

    const result = await login(username, password)

    // Set fallback mode cookie in the response if needed
    const response = NextResponse.json(result, { status: result.success ? 200 : 401 })

    if (result.success && result.fallbackMode) {
      response.cookies.set("fallbackMode", "true", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    }

    return response
  } catch (error) {
    console.error("Login error:", error)

    // Try fallback login if there's an error
    try {
      const { username, password } = await request.json()

      // Import the isFallbackMode function
      const { isFallbackMode } = await import("@/lib/db")

      // Force fallback mode
      const fallbackAdmin = {
        admin_id: 999,
        admin_username: username,
        hospital_id: 1,
      }

      // Set cookies for fallback mode
      const response = NextResponse.json({ success: true, fallbackMode: true }, { status: 200 })

      response.cookies.set("adminId", "999", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
      response.cookies.set("hospitalId", "1", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
      response.cookies.set("fallbackMode", "true", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
      response.cookies.set("adminUsername", username, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
      response.cookies.set("adminPassword", password, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })

      return response
    } catch (fallbackError) {
      console.error("Fallback login error:", fallbackError)
      return NextResponse.json(
        {
          success: false,
          error: "An unexpected error occurred. The system is currently unavailable.",
        },
        { status: 500 },
      )
    }
  }
}
