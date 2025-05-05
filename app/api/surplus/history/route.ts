import { type NextRequest, NextResponse } from "next/server"
import { getSurplusTransferHistory } from "@/lib/surplus-utils"
import { requireApiAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireApiAuth(request)
    if (!session.success) {
      return NextResponse.json({ error: session.error }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const hospitalId = Number.parseInt(searchParams.get("hospitalId") || session.hospitalId.toString())

    // Validate hospital ID
    if (isNaN(hospitalId)) {
      return NextResponse.json({ error: "Invalid hospital ID" }, { status: 400 })
    }

    // Get transfer history
    try {
      const history = await getSurplusTransferHistory(hospitalId)
      return NextResponse.json(history)
    } catch (error: any) {
      // Check if the error is about the missing table
      if (
        error.message &&
        (error.message.includes('relation "surplus_transfers" does not exist') ||
          error.message.includes("table surplus_transfers does not exist"))
      ) {
        console.warn("The surplus_transfers table does not exist yet. Returning empty array.")
        return NextResponse.json([])
      }

      // Handle other errors
      console.error("Error fetching surplus transfer history:", error)
      return NextResponse.json({ error: "Failed to fetch transfer history", details: error.message }, { status: 500 })
    }
  } catch (error) {
    console.error("Unhandled error in surplus history API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
