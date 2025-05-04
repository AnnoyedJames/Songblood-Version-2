import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { logError } from "@/lib/error-handling"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getSession()

    return NextResponse.json({
      authenticated: !!session,
      session: session
        ? {
            adminId: session.adminId,
            hospitalId: session.hospitalId,
          }
        : null,
    })
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
