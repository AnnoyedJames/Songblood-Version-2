import { NextResponse } from "next/server"
import { addNewPlateletsBag } from "@/lib/db"
import { cookies } from "next/headers"

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
    const { donorName, amount, expirationDate, bloodType, rh, hospitalId: formHospitalId } = await request.json()

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

    // Add new platelets bag
    const result = await addNewPlateletsBag(
      donorName,
      amount,
      Number(hospitalId),
      expirationDate,
      bloodType,
      rh,
      adminUsername,
      adminPassword,
    )

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Add platelets error:", error)
    return NextResponse.json({ success: false, error: error.message || "An error occurred" }, { status: 500 })
  }
}
