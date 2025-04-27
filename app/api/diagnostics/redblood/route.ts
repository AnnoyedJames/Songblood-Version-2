import { NextResponse } from "next/server"
import { diagnoseRedBloodInventory } from "@/lib/db-diagnostics"
import { cookies } from "next/headers"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Get session
    const cookieStore = cookies()
    const adminId = cookieStore.get("adminId")?.value
    const hospitalId = cookieStore.get("hospitalId")?.value

    if (!adminId || !hospitalId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Run diagnostics
    const diagnosticResults = await diagnoseRedBloodInventory(Number(hospitalId))

    return NextResponse.json(diagnosticResults)
  } catch (error: any) {
    console.error("Red blood diagnostics error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
