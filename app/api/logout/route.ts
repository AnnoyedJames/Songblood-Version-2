import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { logout } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Call the logout function to invalidate the session
    await logout()

    // Clear the session cookie
    cookies().delete("session_token")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
