import { NextResponse } from "next/server"
import { clearSession } from "@/lib/auth"
import { logError } from "@/lib/error-handling"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    // Get the request body if any
    const body = await request.json().catch(() => ({}))

    // Log the logout attempt for audit purposes
    console.log("Logout attempt:", {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || "unknown",
    })

    // Clear the session
    const clearResult = await clearSession()

    if (!clearResult) {
      throw new Error("Failed to clear session")
    }

    // Set headers to prevent caching
    const headers = new Headers()
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")
    headers.set("Surrogate-Control", "no-store")

    // Add security headers
    headers.set("X-Content-Type-Options", "nosniff")
    headers.set("X-Frame-Options", "DENY")
    headers.set("Content-Security-Policy", "frame-ancestors 'none'")

    // Log successful logout
    console.log("Logout successful")

    // Construct the absolute URL for redirection
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const redirectUrl = new URL("/login?reason=logout-success", baseUrl)

    // Use 303 See Other to ensure POST → GET redirection
    return NextResponse.redirect(redirectUrl, {
      status: 303,
      headers,
    })
  } catch (error) {
    const appError = logError(error, "Logout API")

    // Log the error details
    console.error("Logout error:", {
      message: appError.message,
      stack: appError.stack,
      timestamp: new Date().toISOString(),
    })

    // Return a JSON error response first
    if (request.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          message: "Logout failed: " + appError.message,
          error: process.env.NODE_ENV === "development" ? appError.stack : undefined,
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Otherwise redirect to login with error
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const redirectUrl = new URL("/login?reason=error", baseUrl)

    return NextResponse.redirect(redirectUrl, {
      status: 303,
      headers: {
        "Cache-Control": "no-store",
      },
    })
  }
}

// Add OPTIONS method to handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Logout-Token",
      "Access-Control-Max-Age": "86400",
    },
  })
}
