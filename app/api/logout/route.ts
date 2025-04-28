import { NextResponse } from "next/server"
import { clearSession } from "@/lib/auth"
import { logError } from "@/lib/error-handling"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    await clearSession()

    // Construct the absolute URL for redirection
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const redirectUrl = new URL("/login?reason=logout-success", baseUrl)

    // Use 303 See Other to ensure POST → GET redirection
    return NextResponse.redirect(redirectUrl, { status: 303 })
  } catch (error) {
    const appError = logError(error, "Logout API")

    // Even if there's an error, try to redirect to login
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const redirectUrl = new URL("/login?reason=error", baseUrl)

    return NextResponse.redirect(redirectUrl, { status: 303 })
  }
}
