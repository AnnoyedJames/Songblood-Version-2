import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getSession()

    return NextResponse.json({
      authenticated: !!session,
      session: session
        ? {
            hospitalId: session.hospitalId,
          }
        : null,
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({
      authenticated: false,
      error: "Failed to check session",
    })
  }
}
