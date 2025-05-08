import { NextResponse } from "next/server"
import { clearSession } from "@/lib/auth"
import { logError } from "@/lib/error-handling"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    // Clear the session
    await clearSession()

    // Set headers to prevent caching
    const headers = new Headers()
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")
    headers.set("Surrogate-Control", "no-store")

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

    // Even if there's an error, try to redirect to login
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const redirectUrl = new URL("/login?reason=error", baseUrl)

    return NextResponse.redirect(redirectUrl, { status: 303 })
  }
}

// Add OPTIONS method to handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
