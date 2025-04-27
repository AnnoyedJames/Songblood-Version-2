import { NextResponse } from "next/server"
import { diagnoseRedBloodInventory } from "@/lib/db-diagnostics"
import { cookies } from "next/headers"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Get session
    const cookieStore = cookies()
    const adminId = cookieStore.get("adminId")?.value
    const hospitalId = cookieStore.get("hospitalId")?.value

    if (!adminId || !hospitalId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Parse filter parameters from URL
    const url = new URL(request.url)
    const showAllHospitals = url.searchParams.get("showAllHospitals") === "true"
    const bloodType = url.searchParams.get("bloodType") || undefined
    const rhFactor = url.searchParams.get("rhFactor") || undefined
    const expirationStatus = (url.searchParams.get("expirationStatus") as "all" | "valid" | "expired") || "all"
    const limit = Number.parseInt(url.searchParams.get("limit") || "100", 10)

    // Run diagnostics with filters
    const diagnosticResults = await diagnoseRedBloodInventory({
      hospitalId: Number(hospitalId),
      showAllHospitals,
      bloodType,
      rhFactor,
      expirationStatus,
      limit,
    })

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
