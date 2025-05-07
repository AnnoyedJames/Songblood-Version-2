import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { AppError, ErrorType } from "@/lib/error-handling"
import { sql } from "@/lib/db"
import { isPreviewEnvironment } from "@/lib/env-utils"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()

    // Parse request body
    const body = await request.json()
    const { bagId, entryType, donorName, bloodType, rh, amount, expirationDate } = body

    // Validate required fields
    if (!bagId || !entryType || !donorName || !bloodType || !amount || !expirationDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if we're in a preview environment
    if (isPreviewEnvironment()) {
      console.log("[Preview Mode] Simulating donor update:", {
        bagId,
        entryType,
        donorName,
        bloodType,
        rh,
        amount,
        expirationDate,
      })

      // Return success for preview environments
      return NextResponse.json({ success: true })
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

    // Update the entry
    if (entryType === "RedBlood" || entryType === "Platelets") {
      // These types have rh field
      await sql(
        `
        UPDATE ${tableName}
        SET donor_name = $1, blood_type = $2, rh = $3, amount = $4, expiration_date = $5
        WHERE bag_id = $6
      `,
        donorName,
        bloodType,
        rh || "",
        amount,
        expirationDate,
        bagId,
      )
    } else {
      // Plasma doesn't have rh field
      await sql(
        `
        UPDATE ${tableName}
        SET donor_name = $1, blood_type = $2, amount = $3, expiration_date = $4
        WHERE bag_id = $5
      `,
        donorName,
        bloodType,
        amount,
        expirationDate,
        bagId,
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating entry:", error)

    // Handle specific error types
    if (error instanceof AppError) {
      if (error.type === ErrorType.AUTHENTICATION) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      } else if (error.type === ErrorType.DATABASE_CONNECTION) {
        return NextResponse.json({ error: "Database connection error" }, { status: 503 })
      }
    }

    // Default error response
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 })
  }
}
