import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSessionData } from "@/lib/session-utils"

export async function POST(request: Request) {
  try {
    // Get session data to check if user is authenticated
    const session = await getSessionData()
    if (!session || !session.isLoggedIn) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { bagId, entryType } = body

    // Validate required fields
    if (!bagId || !entryType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Determine which table to update based on entry type
    let tableName = ""
    if (entryType === "RedBlood") {
      tableName = "redblood_inventory"
    } else if (entryType === "Plasma") {
      tableName = "plasma_inventory"
    } else if (entryType === "Platelets") {
      tableName = "platelets_inventory"
    } else {
      return NextResponse.json({ error: "Invalid entry type" }, { status: 400 })
    }

    // Get the hospital ID of the entry to ensure the user has permission to update it
    const entryQuery = `
      SELECT hospital_id FROM ${tableName} WHERE bag_id = $1
    `
    const entryResult = await sql(entryQuery, bagId)

    if (entryResult.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    const entryHospitalId = entryResult[0].hospital_id

    // Check if the user belongs to the same hospital as the entry
    if (entryHospitalId !== session.hospitalId) {
      return NextResponse.json({ error: "You don't have permission to delete this entry" }, { status: 403 })
    }

    // Soft delete the entry by setting active = false
    const updateQuery = `
      UPDATE ${tableName}
      SET active = false
      WHERE bag_id = $1
    `
    await sql(updateQuery, bagId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in soft delete donor API:", error)

    return NextResponse.json({ error: "Failed to delete entry. Please try again later." }, { status: 500 })
  }
}
