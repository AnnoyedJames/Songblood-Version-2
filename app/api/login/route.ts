import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSession } from "@/lib/auth"
import { verifyAdminCredentials } from "@/lib/auth-utils"
import { sql } from "@/lib/db"

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

    // First, check if the database is accessible
    try {
      const dbCheck = await sql`SELECT 1 as db_check`
      console.log("Database connection check:", dbCheck)
    } catch (dbError) {
      console.error("Database connection error during login:", dbError)
      return NextResponse.json(
        {
          error: "Database connection error. Please try again later.",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 503 },
      )
    }

    // Check if the admins table exists and has data
    try {
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'admins'
        ) as exists
      `

      if (!tableExists[0].exists) {
        console.log("Admins table does not exist")
        return NextResponse.json(
          {
            error: "Authentication failed",
            details: "Database schema is not properly set up. Please initialize the database.",
          },
          { status: 500 },
        )
      }

      const adminCheck = await sql`SELECT COUNT(*) as count FROM admins`
      console.log(`Admin count in database: ${adminCheck[0]?.count || 0}`)

      if (adminCheck[0]?.count === 0) {
        console.log("No admins found in database")
        return NextResponse.json(
          {
            error: "Authentication failed",
            details: "No admin accounts exist in the database. Please initialize a test admin.",
          },
          { status: 500 },
        )
      }
    } catch (tableError) {
      console.error("Error checking admins table:", tableError)
      return NextResponse.json(
        {
          error: "Authentication failed",
          details:
            "Error checking database tables: " + (tableError instanceof Error ? tableError.message : "Unknown error"),
        },
        { status: 500 },
      )
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
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        error: "Login failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
