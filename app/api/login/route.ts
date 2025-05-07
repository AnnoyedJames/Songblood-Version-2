import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { createSession } from "@/lib/auth"
import { isPreviewEnvironment } from "@/lib/env-utils"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { username, password } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Check if we're in a preview environment
    if (isPreviewEnvironment()) {
      console.log("[Preview Mode] Simulating login for:", username)

      // Create a session token
      const token = await createSession(1)

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

      return NextResponse.json({ success: true })
    }

    // Verify credentials
    const result = await sql(
      `
      SELECT id, hospital_id, password_hash
      FROM admins
      WHERE username = $1
    `,
      username,
    )

    if (result.length === 0) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    const admin = result[0]

    // In a real app, you would verify the password hash here
    // For simplicity, we're just checking if the passwords match
    if (password !== admin.password_hash) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    // Create a session
    const token = await createSession(admin.id)

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
