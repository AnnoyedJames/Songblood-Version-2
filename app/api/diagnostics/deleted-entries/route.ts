import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { dbClient } from "@/lib/db"
import { AppError, ErrorType } from "@/lib/error-handling"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get the hospital ID from the session
    const { hospitalId } = session

    // Get URL parameters
    const url = new URL(request.url)
    const showAllHospitals = url.searchParams.get("showAllHospitals") === "true"

    // Get deleted entries based on hospital access
    let redBloodEntries, plasmaEntries, plateletsEntries

    if (showAllHospitals) {
      // Query for all hospitals
      redBloodEntries = await dbClient`
        SELECT rb.*, h.hospital_name, 'RedBlood' as type
        FROM redblood_inventory rb
        JOIN hospital h ON rb.hospital_id = h.hospital_id
        WHERE rb.active = false
        ORDER BY rb.bag_id DESC
      `

      plasmaEntries = await dbClient`
        SELECT p.*, h.hospital_name, 'Plasma' as type
        FROM plasma_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.active = false
        ORDER BY p.bag_id DESC
      `

      plateletsEntries = await dbClient`
        SELECT p.*, h.hospital_name, 'Platelets' as type
        FROM platelets_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.active = false
        ORDER BY p.bag_id DESC
      `
    } else {
      // Query for specific hospital
      redBloodEntries = await dbClient`
        SELECT rb.*, h.hospital_name, 'RedBlood' as type
        FROM redblood_inventory rb
        JOIN hospital h ON rb.hospital_id = h.hospital_id
        WHERE rb.hospital_id = ${hospitalId} AND rb.active = false
        ORDER BY rb.bag_id DESC
      `

      plasmaEntries = await dbClient`
        SELECT p.*, h.hospital_name, 'Plasma' as type
        FROM plasma_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.hospital_id = ${hospitalId} AND p.active = false
        ORDER BY p.bag_id DESC
      `

      plateletsEntries = await dbClient`
        SELECT p.*, h.hospital_name, 'Platelets' as type
        FROM platelets_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.hospital_id = ${hospitalId} AND p.active = false
        ORDER BY p.bag_id DESC
      `
    }

    // Combine all entries
    const allEntries = [
      ...redBloodEntries.map((entry: any) => ({
        ...entry,
        deleted_at: new Date().toISOString(), // In a real app, this would be stored in the database
      })),
      ...plasmaEntries.map((entry: any) => ({
        ...entry,
        deleted_at: new Date().toISOString(),
        rh: entry.rh || "", // Ensure rh is defined for plasma
      })),
      ...plateletsEntries.map((entry: any) => ({
        ...entry,
        deleted_at: new Date().toISOString(),
      })),
    ]

    return NextResponse.json({ success: true, entries: allEntries })
  } catch (error) {
    console.error("Error fetching deleted entries:", error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.type === ErrorType.AUTHENTICATION ? 401 : 400 },
      )
    }

    return NextResponse.json({ success: false, error: "Failed to fetch deleted entries" }, { status: 500 })
  }
}
