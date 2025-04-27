import { NextResponse } from "next/server"
import { clearSession } from "@/lib/auth"
import { logError } from "@/lib/error-handling"

export async function POST() {
  try {
    await clearSession()

    // Use a proper redirect response with status code 303
    const redirectUrl = new URL("/login", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")
    redirectUrl.searchParams.set("reason", "logout-success")

    return NextResponse.redirect(redirectUrl, { status: 303 })
  } catch (error) {
    const appError = logError(error, "Logout API")

    // Even if there's an error, try to redirect to login
    const redirectUrl = new URL("/login", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")
    redirectUrl.searchParams.set("reason", "error")

    return NextResponse.redirect(redirectUrl, { status: 303 })
  }
}
