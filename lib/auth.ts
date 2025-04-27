import { cookies } from "next/headers"
import { verifyAdminCredentials, registerAdmin } from "./db"
import { AppError, ErrorType, logError } from "./error-handling"

// Session management
export async function createSession(adminId: number, hospitalId: number, username?: string, password?: string) {
  try {
    const oneDay = 24 * 60 * 60 * 1000
    cookies().set("adminId", adminId.toString(), { httpOnly: true, maxAge: oneDay })
    cookies().set("hospitalId", hospitalId.toString(), { httpOnly: true, maxAge: oneDay })

    // Store credentials for API calls if provided
    if (username && password) {
      cookies().set("adminUsername", username, { httpOnly: true, maxAge: oneDay })
      cookies().set("adminPassword", password, { httpOnly: true, maxAge: oneDay })
    }

    return true
  } catch (error) {
    throw logError(error, "Create Session")
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
    throw logError(error, "Get Session")
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
    throw logError(error, "Clear Session")
  }
}

// Authentication middleware
export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new AppError(ErrorType.AUTHENTICATION, "Authentication required")
  }
  return session
}

// Login function
export async function login(username: string, password: string) {
  try {
    const admin = await verifyAdminCredentials(username, password)

    if (!admin) {
      throw new AppError(ErrorType.AUTHENTICATION, "Invalid credentials")
    }

    const sessionCreated = await createSession(admin.admin_id, admin.hospital_id, username, password)

    if (!sessionCreated) {
      throw new AppError(ErrorType.SERVER, "Failed to create session")
    }

    return { success: true }
  } catch (error) {
    // If this is a database connection error, we should still throw it
    // but it will be handled specially in the login API route
    if (error instanceof AppError && error.type === ErrorType.DATABASE_CONNECTION) {
      throw error
    }

    throw logError(error, "Login")
  }
}

// Register function
export async function register(username: string, password: string, hospitalId: number) {
  try {
    const result = await registerAdmin(username, password, hospitalId)

    if (!result.success) {
      throw new AppError(ErrorType.VALIDATION, "Registration failed")
    }

    return { success: true }
  } catch (error) {
    throw logError(error, "Register")
  }
}

// Logout function
export async function logout() {
  return await clearSession()
}
