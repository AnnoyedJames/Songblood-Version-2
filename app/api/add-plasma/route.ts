import { NextResponse } from "next/server"
import { addNewPlasmaBag } from "@/lib/db"
import { cookies } from "next/headers"
import { queryCache } from "@/lib/cache"

export async function POST(request: Request) {
  try {
    // Get session
    const cookieStore = cookies()
    const adminId = cookieStore.get("adminId")?.value
    const hospitalId = cookieStore.get("hospitalId")?.value

    if (!adminId || !hospitalId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { donorName, amount, expirationDate, bloodType, hospitalId: formHospitalId } = await request.json()

    // Validate hospital ID
    if (Number(hospitalId) !== formHospitalId) {
      return NextResponse.json({ success: false, error: "Unauthorized: Hospital mismatch" }, { status: 403 })
    }

    // Get admin credentials from cookies
    const adminUsername = cookieStore.get("adminUsername")?.value
    const adminPassword = cookieStore.get("adminPassword")?.value

    if (!adminUsername || !adminPassword) {
      return NextResponse.json({ success: false, error: "Session expired. Please login again." }, { status: 401 })
    }

    // Add new plasma bag
    const result = await addNewPlasmaBag(
      donorName,
      amount,
      Number(hospitalId),
      expirationDate,
      bloodType,
      adminUsername,
      adminPassword,
    )

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    // Invalidate relevant caches
    queryCache.invalidate(`plasma:${hospitalId}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Add plasma error:", error)
    return NextResponse.json({ success: false, error: error.message || "An error occurred" }, { status: 500 })
  }
}
