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

// Enhanced clearSession function to ensure all cookies are properly cleared
export async function clearSession() {
  try {
    // Log the session clearing attempt
    console.log("Clearing session...")

    // Define cookie options for clearing
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0, // Expire immediately
      sameSite: "strict" as const,
    }

    // Get all cookies to ensure we don't miss any
    const allCookies = cookies().getAll()
    console.log(`Found ${allCookies.length} cookies to examine`)

    // List of known authentication cookies to explicitly clear
    const authCookies = [
      "adminId",
      "hospitalId",
      "adminUsername",
      "adminPassword",
      "fallbackMode",
      "sessionToken",
      "authToken",
      "refreshToken",
    ]

    // Clear known authentication cookies
    for (const cookieName of authCookies) {
      cookies().set(cookieName, "", cookieOptions)
      console.log(`Cleared cookie: ${cookieName}`)
    }

    // Clear any other session-related cookies that might exist
    let additionalCookiesCleared = 0
    for (const cookie of allCookies) {
      // Skip cookies we've already cleared
      if (authCookies.includes(cookie.name)) {
        continue
      }

      // Clear cookies that match authentication patterns
      if (
        cookie.name.toLowerCase().includes("session") ||
        cookie.name.toLowerCase().includes("token") ||
        cookie.name.toLowerCase().includes("auth") ||
        cookie.name.toLowerCase().includes("login") ||
        cookie.name.toLowerCase().includes("user") ||
        cookie.name.toLowerCase().includes("admin")
      ) {
        cookies().set(cookie.name, "", cookieOptions)
        additionalCookiesCleared++
      }
    }

    console.log(`Cleared ${additionalCookiesCleared} additional cookies`)

    // Try clearing with different paths for thoroughness
    const additionalPaths = ["/dashboard", "/login", "/register", "/api"]
    for (const path of additionalPaths) {
      const pathOptions = { ...cookieOptions, path }
      for (const cookieName of authCookies) {
        cookies().set(cookieName, "", pathOptions)
      }
    }

    // Log the logout for audit purposes
    console.log("User session cleared successfully")

    return true
  } catch (error) {
    console.error("Error clearing session:", error)
    throw logError(error, "Clear Session")
  }
}

// Authentication middleware
export async function requireAuth() {
  try {
    const session = await getSession()
    if (!session) {
      throw new AppError(ErrorType.AUTHENTICATION, "Authentication required")
    }
    return session
  } catch (error) {
    // Convert any error to an authentication error for consistent handling
    if (error instanceof AppError && error.type === ErrorType.AUTHENTICATION) {
      throw error
    }
    throw new AppError(ErrorType.AUTHENTICATION, "Authentication failed", { cause: error })
  }
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
  try {
    await clearSession()
    return { success: true }
  } catch (error) {
    throw logError(error, "Logout")
  }
}

// Check if the user is authenticated
export async function isAuthenticated() {
  try {
    const session = await getSession()
    return !!session
  } catch (error) {
    console.error("Error checking authentication:", error)
    return false
  }
}
