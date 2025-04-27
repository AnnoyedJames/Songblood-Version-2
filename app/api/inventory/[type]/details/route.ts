import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { executeSQL } from "@/lib/db-connection"

export async function GET(request: Request, { params }: { params: { type: string } }) {
  try {
    // Get session
    const cookieStore = cookies()
    const adminId = cookieStore.get("adminId")?.value
    const hospitalId = cookieStore.get("hospitalId")?.value

    if (!adminId || !hospitalId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get the type from route params
    const { type } = params
    const { searchParams } = new URL(request.url)
    const queryHospitalId = searchParams.get("hospitalId")

    // Verify the hospital ID matches
    if (!queryHospitalId || Number(hospitalId) !== Number(queryHospitalId)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 })
    }

    let tableName = ""
    switch (type) {
      case "redblood":
        tableName = "redblood_inventory"
        break
      case "plasma":
        tableName = "plasma_inventory"
        break
      case "platelets":
        tableName = "platelets_inventory"
        break
      default:
        return NextResponse.json({ success: false, error: "Invalid inventory type" }, { status: 400 })
    }

    // Fetch detailed inventory for the specified type
    const inventory = await executeSQL(
      `SELECT * FROM ${tableName} 
       WHERE hospital_id = $1 AND expiration_date > CURRENT_DATE
       ORDER BY blood_type, rh`,
      hospitalId,
    )

    return NextResponse.json({ success: true, inventory })
  } catch (error: any) {
    console.error(`Error fetching ${params.type} inventory details:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch inventory details",
      },
      { status: 500 },
    )
  }
}
