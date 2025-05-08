import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import * as bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { username, password } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    console.log(`Attempting login for user: ${username}`)

    // Get admin from database with parameterized query for security
    const admins = await sql`
      SELECT id, username, password_hash, hospital_id
      FROM admins
      WHERE username = ${username}
    `

    // Check if admin exists
    if (admins.length === 0) {
      console.log(`No user found with username: ${username}`)
      // Use a generic error message to prevent username enumeration
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    const admin = admins[0]
    console.log(`Found user with ID: ${admin.id}`)

    // Check password (support both plain text and bcrypt)
    let passwordValid = false

    // First try bcrypt comparison (more secure)
    if (admin.password_hash && admin.password_hash.startsWith("$2")) {
      console.log("Attempting bcrypt password verification")
      passwordValid = await bcrypt.compare(password, admin.password_hash)
    }
    // Then try direct comparison (for plain text passwords - less secure)
    else if (admin.password_hash === password) {
      console.log("Using plain text password comparison (not recommended)")
      passwordValid = true

      // Optionally upgrade to bcrypt hash for future security
      try {
        const hashedPassword = await bcrypt.hash(password, 10)
        await sql`
          UPDATE admins
          SET password_hash = ${hashedPassword}
          WHERE id = ${admin.id}
        `
        console.log(`Upgraded password hash for user ID: ${admin.id}`)
      } catch (hashError) {
        console.error("Failed to upgrade password hash:", hashError)
      }
    }

    if (!passwordValid) {
      console.log(`Invalid password for user: ${username}`)
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    console.log(`Successful login for user: ${username}`)

    // Clean up old sessions for this user
    await sql`
      DELETE FROM admin_sessions
      WHERE admin_id = ${admin.id} OR expires_at < NOW()
    `

    // Generate a secure session token
    const token = generateSecureToken()

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Store session in database
    await sql`
      INSERT INTO admin_sessions (admin_id, token, expires_at)
      VALUES (${admin.id}, ${token}, ${expiresAt})
    `

    // Set the session cookie with secure options
    cookies().set({
      name: "session_token",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    })

    return NextResponse.json({
      success: true,
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred during login",
      },
      { status: 500 },
    )
  }
}

// Generate a more secure random token
function generateSecureToken(): string {
  // Create a buffer with random bytes
  const buffer = new Uint8Array(32)
  crypto.getRandomValues(buffer)

  // Convert to hex string
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
