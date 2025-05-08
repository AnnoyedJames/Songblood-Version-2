import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"

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
  // Check for session cookie
  const cookieStore = cookies()
  const sessionToken = cookieStore.get("session_token")?.value

  // If no session token, redirect to login
  if (!sessionToken) {
    redirect("/login")
  }

  // Verify session in database
  const sessionResult = await sql`
    SELECT a.id as admin_id, a.hospital_id, a.username
    FROM admin_sessions s
    JOIN admins a ON s.admin_id = a.id
    WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
  `

  // If session not found or expired, redirect to login
  if (sessionResult.length === 0) {
    redirect("/login")
  }

  // Return session data
  return {
    adminId: sessionResult[0].admin_id,
    hospitalId: sessionResult[0].hospital_id,
    username: sessionResult[0].username,
    isLoggedIn: true,
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

    // Delete session from database
    await sql`
      DELETE FROM admin_sessions
      WHERE token = ${sessionToken}
    `
  } catch (error) {
    console.error("Error during logout:", error)
  }
}
