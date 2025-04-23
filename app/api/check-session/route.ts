import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isFallbackMode } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()

    return NextResponse.json({
      authenticated: !!session,
      fallbackMode: isFallbackMode(),
      session: session
        ? {
            hospitalId: session.hospitalId,
            fallbackMode: session.fallbackMode,
          }
        : null,
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({
      authenticated: false,
      fallbackMode: true,
      error: "Failed to check session",
    })
  }
}
