import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSession } from "@/lib/auth"
import { verifyAdminCredentials } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { username, password } = body

    // Add detailed logging
    console.log(`Login attempt for username: ${username}`)

    // Validate required fields
    if (!username || !password) {
      console.log("Login failed: Missing username or password")
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Verify credentials
    try {
      const adminId = await verifyAdminCredentials(username, password)

      if (!adminId) {
        console.log(`Login failed: Invalid credentials for username: ${username}`)
        return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
      }

      console.log(`Login successful for username: ${username}, adminId: ${adminId}`)

      // Create a session
      const token = await createSession(adminId)

      // Set the session cookie
      cookies().set({
        name: "session_token",
        value: token,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
      })

      return NextResponse.json({ success: true, message: "Login successful" })
    } catch (error) {
      console.error("Error verifying credentials:", error)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
