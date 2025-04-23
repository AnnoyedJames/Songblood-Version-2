import { cookies } from "next/headers"
import { verifyAdminCredentials, isFallbackMode } from "./db"

// Session management
export async function createSession(adminId: number, hospitalId: number) {
  try {
    const oneDay = 24 * 60 * 60 * 1000
    cookies().set("adminId", adminId.toString(), { httpOnly: true, maxAge: oneDay })
    cookies().set("hospitalId", hospitalId.toString(), { httpOnly: true, maxAge: oneDay })
    cookies().set("adminUsername", "demo", { httpOnly: true, maxAge: oneDay }) // Add for fallback mode
    cookies().set("adminPassword", "demo", { httpOnly: true, maxAge: oneDay }) // Add for fallback mode

    // Store fallback mode status in cookie
    if (isFallbackMode()) {
      cookies().set("fallbackMode", "true", { httpOnly: true, maxAge: oneDay })
    }
    return true
  } catch (error) {
    console.error("Error creating session:", error)
    return false
  }
}

export async function getSession() {
  try {
    const adminId = cookies().get("adminId")?.value
    const hospitalId = cookies().get("hospitalId")?.value

    if (!adminId || !hospitalId) {
      return null
    }

    return {
      adminId: Number(adminId),
      hospitalId: Number(hospitalId),
      fallbackMode: cookies().get("fallbackMode")?.value === "true",
    }
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function clearSession() {
  try {
    cookies().delete("adminId")
    cookies().delete("hospitalId")
    cookies().delete("fallbackMode")
    cookies().delete("adminUsername")
    cookies().delete("adminPassword")
    return true
  } catch (error) {
    console.error("Error clearing session:", error)
    return false
  }
}

// Authentication middleware with error handling
export async function requireAuth() {
  try {
    const session = await getSession()

    if (!session) {
      // Instead of redirecting, we'll return null
      // The calling component should handle this case
      return null
    }

    return session
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

// Login function
export async function login(username: string, password: string) {
  try {
    const admin = await verifyAdminCredentials(username, password)

    if (!admin) {
      return { success: false, error: "Invalid credentials", fallbackMode: isFallbackMode() }
    }

    const sessionCreated = await createSession(admin.admin_id, admin.hospital_id)

    if (!sessionCreated) {
      return {
        success: false,
        error: "Failed to create session",
        fallbackMode: isFallbackMode(),
      }
    }

    // Store credentials for API calls
    cookies().set("adminUsername", username, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    cookies().set("adminPassword", password, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })

    return { success: true, fallbackMode: isFallbackMode() }
  } catch (error: any) {
    console.error("Login error:", error)

    // If in fallback mode, create a demo session
    if (isFallbackMode() && (username === "demo" || username === "Panya")) {
      await createSession(1, 1)
      return { success: true, fallbackMode: true }
    }

    return {
      success: false,
      error: error.message || "Authentication service unavailable",
      fallbackMode: true,
    }
  }
}

// Logout function
export async function logout() {
  return await clearSession()
}
