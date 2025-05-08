import { NextResponse, type NextRequest } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getHospitalSurplus } from "@/lib/surplus-utils"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()

    // Get hospitalId from query params or session
    const url = new URL(request.url)
    const hospitalId = url.searchParams.get("hospitalId")
      ? Number.parseInt(url.searchParams.get("hospitalId")!)
      : session.hospitalId

    // Verify the user has access to this hospital's data
    if (hospitalId !== session.hospitalId) {
      return NextResponse.json({ error: "Unauthorized access to hospital data" }, { status: 403 })
    }

    // Get hospital surplus
    const surplus = await getHospitalSurplus(hospitalId)

    return NextResponse.json(surplus)
  } catch (error) {
    console.error("Error fetching hospital surplus:", error)
    return NextResponse.json({ error: "Failed to fetch hospital surplus" }, { status: 500 })
  }
}
