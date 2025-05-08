import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { updateBloodEntry } from "@/lib/db-diagnostics"
import { AppError, ErrorType } from "@/lib/error-handling"

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get the hospital ID from the session
    const { hospitalId } = session

    // Parse the request body
    const entry = await request.json()

    // Validate the entry
    if (!entry || !entry.bag_id || !entry.type) {
      return NextResponse.json({ success: false, error: "Invalid entry data" }, { status: 400 })
    }

    // Additional validation
    if (!entry.donor_name || entry.donor_name.trim() === "") {
      return NextResponse.json({ success: false, error: "Donor name is required" }, { status: 400 })
    }

    if (!entry.amount || isNaN(entry.amount) || entry.amount <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be a positive number" }, { status: 400 })
    }

    if (!entry.expiration_date) {
      return NextResponse.json({ success: false, error: "Expiration date is required" }, { status: 400 })
    }

    try {
      // Validate expiration date format
      new Date(entry.expiration_date)
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid expiration date format" }, { status: 400 })
    }

    // Update the entry
    const result = await updateBloodEntry({
      bagId: entry.bag_id,
      entryType: entry.type,
      donorName: entry.donor_name,
      amount: entry.amount,
      expirationDate: entry.expiration_date,
      hospitalId,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Entry updated successfully",
        bagId: entry.bag_id,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: result.details || "Failed to update the entry in the database",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error updating blood entry:", error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.type === ErrorType.AUTHENTICATION ? 401 : 400 },
      )
    }

    return NextResponse.json({ success: false, error: "Failed to update blood entry" }, { status: 500 })
  }
}
