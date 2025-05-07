import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { AppError, ErrorType } from "@/lib/error-handling"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()

    // Parse request body
    const body = await request.json()
    const { bagId, entryType } = body

    // Validate required fields
    if (!bagId || !entryType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Determine which table to update based on entry type
    let tableName
    if (entryType === "RedBlood") {
      tableName = "redblood_inventory"
    } else if (entryType === "Plasma") {
      tableName = "plasma_inventory"
    } else if (entryType === "Platelets") {
      tableName = "platelets_inventory"
    } else {
      return NextResponse.json({ error: "Invalid entry type" }, { status: 400 })
    }

    // Get the hospital ID of the entry to ensure the user has permission
    const entryResult = await sql(
      `
      SELECT hospital_id FROM ${tableName} WHERE bag_id = $1
    `,
      bagId,
    )

    if (entryResult.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    const entryHospitalId = entryResult[0].hospital_id

    // Verify the user has access to this hospital's data
    if (entryHospitalId !== session.hospitalId) {
      return NextResponse.json({ error: "Unauthorized access to hospital data" }, { status: 403 })
    }

    // Soft delete the entry by setting active = false
    await sql(
      `
      UPDATE ${tableName}
      SET active = false
      WHERE bag_id = $1
    `,
      bagId,
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error soft deleting entry:", error)

    // Handle specific error types
    if (error instanceof AppError) {
      if (error.type === ErrorType.AUTHENTICATION) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      } else if (error.type === ErrorType.DATABASE_CONNECTION) {
        return NextResponse.json({ error: "Database connection error" }, { status: 503 })
      }
    }

    // Default error response
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 })
  }
}
