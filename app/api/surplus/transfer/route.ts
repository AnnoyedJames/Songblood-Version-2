import { NextResponse, type NextRequest } from "next/server"
import { requireAuth } from "@/lib/auth"
import { recordSurplusTransfer } from "@/lib/surplus-utils"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()

    // Parse request body
    const body = await request.json()
    const { fromHospitalId, toHospitalId, type, bloodType, rh, amount, units } = body

    // Verify the user has access to the sending hospital's data
    if (fromHospitalId !== session.hospitalId) {
      return NextResponse.json({ error: "Unauthorized access to hospital data" }, { status: 403 })
    }

    // Record the transfer
    const result = await recordSurplusTransfer(fromHospitalId, toHospitalId, type, bloodType, rh || "", amount, units)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error recording surplus transfer:", error)
    return NextResponse.json({ error: "Failed to record surplus transfer" }, { status: 500 })
  }
}
