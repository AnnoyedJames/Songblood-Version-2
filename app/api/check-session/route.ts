import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { logError } from "@/lib/error-handling"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getSession()

    // Set headers to prevent caching
    const headers = new Headers()
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")
    headers.set("Surrogate-Control", "no-store")

    return NextResponse.json(
      {
        authenticated: !!session,
        session: session
          ? {
              adminId: session.adminId,
              hospitalId: session.hospitalId,
              // Add timestamp for client-side validation
              lastChecked: Date.now(),
            }
          : null,
      },
      { headers },
    )
  } catch (error) {
    const appError = logError(error, "Check Session API")

    return NextResponse.json(
      {
        authenticated: false,
        error: appError.message,
      },
      { status: 500 },
    )
  }
}
