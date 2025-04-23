import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyAdminCredentials, isFallbackMode } from "./db"

// Session management
export async function createSession(adminId: number, hospitalId: number) {
  const oneDay = 24 * 60 * 60 * 1000
  cookies().set("adminId", adminId.toString(), { httpOnly: true, maxAge: oneDay })
  cookies().set("hospitalId", hospitalId.toString(), { httpOnly: true, maxAge: oneDay })

  // Store fallback mode status in cookie
  if (isFallbackMode()) {
    cookies().set("fallbackMode", "true", { httpOnly: true, maxAge: oneDay })
  }
}

export async function getSession() {
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
}

export async function clearSession() {
  cookies().delete("adminId")
  cookies().delete("hospitalId")
  cookies().delete("fallbackMode")
}

// Authentication middleware
export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return session
}

// Login function
export async function login(username: string, password: string) {
  try {
    const admin = await verifyAdminCredentials(username, password)

    if (!admin) {
      return { success: false, error: "Invalid credentials", fallbackMode: isFallbackMode() }
    }

    await createSession(admin.admin_id, admin.hospital_id)
    return { success: true, fallbackMode: isFallbackMode() }
  } catch (error: any) {
    console.error("Login error:", error)
    return {
      success: false,
      error: error.message || "Authentication service unavailable",
      fallbackMode: true,
    }
  }
}

// Logout function
export async function logout() {
  await clearSession()
}
