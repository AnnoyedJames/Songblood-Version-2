import { NextResponse, type NextRequest } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getSurplusTransferHistory } from "@/lib/surplus-utils"

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

    // Get transfer history
    try {
      const history = await getSurplusTransferHistory(hospitalId)
      return NextResponse.json(history)
    } catch (error: any) {
      // Handle errors
      console.error("Error fetching surplus transfer history:", error)
      return NextResponse.json({ error: "Failed to fetch transfer history" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in surplus history API:", error)
    return NextResponse.json({ error: "Failed to fetch surplus transfer history" }, { status: 500 })
  }
}
