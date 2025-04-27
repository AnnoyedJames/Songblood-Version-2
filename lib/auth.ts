import { cookies } from "next/headers"
import { verifyAdminCredentials, registerAdmin } from "./db"

// Session management
export async function createSession(adminId: number, hospitalId: number) {
  try {
    const oneDay = 24 * 60 * 60 * 1000
    cookies().set("adminId", adminId.toString(), { httpOnly: true, maxAge: oneDay })
    cookies().set("hospitalId", hospitalId.toString(), { httpOnly: true, maxAge: oneDay })
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
    cookies().delete("adminUsername")
    cookies().delete("adminPassword")
    return true
  } catch (error) {
    console.error("Error clearing session:", error)
    return false
  }
}

// Authentication middleware
export async function requireAuth() {
  const session = await getSession()
  return session
}

// Login function
export async function login(username: string, password: string) {
  try {
    const admin = await verifyAdminCredentials(username, password)

    if (!admin) {
      return { success: false, error: "Invalid credentials" }
    }

    const sessionCreated = await createSession(admin.admin_id, admin.hospital_id)

    if (!sessionCreated) {
      return { success: false, error: "Failed to create session" }
    }

    // Store credentials in cookies for API calls
    cookies().set("adminUsername", username, { httpOnly: true })
    cookies().set("adminPassword", password, { httpOnly: true })

    return { success: true }
  } catch (error: any) {
    console.error("Login error:", error)
    throw error
  }
}

// Register function
export async function register(username: string, password: string, hospitalId: number) {
  try {
    const result = await registerAdmin(username, password, hospitalId)
    return result
  } catch (error: any) {
    console.error("Registration error:", error)
    throw error
  }
}

// Logout function
export async function logout() {
  return await clearSession()
}
