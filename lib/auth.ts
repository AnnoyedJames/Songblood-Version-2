import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { AppError, ErrorType } from "@/lib/error-handling"
import { isPreviewEnvironment } from "@/lib/env-utils"

export type SessionData = {
  adminId: number
  hospitalId: number
  username: string
  isLoggedIn: boolean
}

/**
 * Checks if the user is authenticated and returns session data
 * Redirects to login page if not authenticated
 */
export async function requireAuth(): Promise<SessionData> {
  try {
    // Check for session cookie
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    // If no session token, redirect to login
    if (!sessionToken) {
      console.log("No session token found, redirecting to login")
      redirect("/login?reason=no-session")
    }

    // In preview environments, use mock session data
    if (isPreviewEnvironment()) {
      console.log("[Preview Mode] Using mock session data")
      return {
        adminId: 1,
        hospitalId: 1,
        username: "admin",
        isLoggedIn: true,
      }
    }

    // Verify session in database
    const sessionResult = await sql(
      `
      SELECT a.id as admin_id, a.hospital_id, a.username
      FROM admin_sessions s
      JOIN admins a ON s.admin_id = a.id
      WHERE s.token = $1 AND s.expires_at > NOW()
    `,
      sessionToken,
    )

    // If session not found or expired, redirect to login
    if (sessionResult.length === 0) {
      console.log("Invalid or expired session, redirecting to login")
      redirect("/login?reason=invalid-session")
    }

    // Return session data
    return {
      adminId: sessionResult[0].admin_id,
      hospitalId: sessionResult[0].hospital_id,
      username: sessionResult[0].username,
      isLoggedIn: true,
    }
  } catch (error) {
    console.error("Authentication error:", error)

    // If it's a database connection error, throw a specific error
    if (error instanceof Error && (error.message.includes("database") || error.message.includes("connection"))) {
      throw new AppError("Database connection failed during authentication", ErrorType.DATABASE_CONNECTION)
    }

    // For other errors, redirect to login
    redirect("/login?reason=auth-error")
  }
}

/**
 * Creates a new session for the admin
 */
export async function createSession(adminId: number): Promise<string> {
  try {
    // Generate a random token
    const token = generateRandomToken()

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // In preview environments, just return the token without database operations
    if (isPreviewEnvironment()) {
      console.log("[Preview Mode] Creating mock session for admin ID:", adminId)
      return token
    }

    // Store session in database
    await sql(
      `
      INSERT INTO admin_sessions (admin_id, token, expires_at)
      VALUES ($1, $2, $3)
    `,
      adminId,
      token,
      expiresAt,
    )

    return token
  } catch (error) {
    console.error("Error creating session:", error)
    throw new AppError("Failed to create session", ErrorType.DATABASE_CONNECTION)
  }
}

/**
 * Invalidates the current session
 */
export async function logout(): Promise<void> {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return
    }

    // In preview environments, just log the logout
    if (isPreviewEnvironment()) {
      console.log("[Preview Mode] Logging out session")
      return
    }

    // Delete session from database
    await sql(
      `
      DELETE FROM admin_sessions
      WHERE token = $1
    `,
      sessionToken,
    )
  } catch (error) {
    console.error("Error during logout:", error)
    // We don't throw here to ensure the user can always log out
  }
}

/**
 * Generates a random token for session
 */
function generateRandomToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
