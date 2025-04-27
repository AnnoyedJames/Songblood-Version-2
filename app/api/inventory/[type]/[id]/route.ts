import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { executeSQL } from "@/lib/db-connection"
import { queryCache } from "@/lib/cache"

// UPDATE an inventory item
export async function PUT(request: Request, { params }: { params: { type: string; id: string } }) {
  try {
    // Get session
    const cookieStore = cookies()
    const adminId = cookieStore.get("adminId")?.value
    const hospitalId = cookieStore.get("hospitalId")?.value

    if (!adminId || !hospitalId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get the type and ID from route params
    const { type, id } = params
    const bagId = Number.parseInt(id)

    if (isNaN(bagId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    // Get request body
    const body = await request.json()
    const { donor_name, blood_type, rh, amount, expiration_date, hospitalId: bodyHospitalId } = body

    // Validate hospital ID
    if (Number(hospitalId) !== Number(bodyHospitalId)) {
      return NextResponse.json({ success: false, error: "Unauthorized: Hospital mismatch" }, { status: 403 })
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

    // Validate the item exists and belongs to this hospital
    const existingItem = await executeSQL(
      `SELECT * FROM ${tableName} WHERE bag_id = $1 AND hospital_id = $2`,
      bagId,
      hospitalId,
    )

    if (existingItem.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Item not found or does not belong to this hospital",
        },
        { status: 404 },
      )
    }

    // Update the item
    await executeSQL(
      `UPDATE ${tableName}
       SET donor_name = $1, blood_type = $2, rh = $3, amount = $4, expiration_date = $5
       WHERE bag_id = $6 AND hospital_id = $7`,
      donor_name,
      blood_type,
      rh,
      amount,
      expiration_date,
      bagId,
      hospitalId,
    )

    // Invalidate relevant cache
    queryCache.invalidate(`${type}:${hospitalId}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`Error updating ${params.type} inventory item:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update inventory item",
      },
      { status: 500 },
    )
  }
}

// DELETE an inventory item
export async function DELETE(request: Request, { params }: { params: { type: string; id: string } }) {
  try {
    // Get session
    const cookieStore = cookies()
    const adminId = cookieStore.get("adminId")?.value
    const hospitalId = cookieStore.get("hospitalId")?.value

    if (!adminId || !hospitalId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get the type and ID from route params
    const { type, id } = params
    const bagId = Number.parseInt(id)

    if (isNaN(bagId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    // Get request body to validate hospital ID
    const body = await request.json()
    const bodyHospitalId = body.hospitalId

    // Validate hospital ID
    if (Number(hospitalId) !== Number(bodyHospitalId)) {
      return NextResponse.json({ success: false, error: "Unauthorized: Hospital mismatch" }, { status: 403 })
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

    // Validate the item exists and belongs to this hospital
    const existingItem = await executeSQL(
      `SELECT * FROM ${tableName} WHERE bag_id = $1 AND hospital_id = $2`,
      bagId,
      hospitalId,
    )

    if (existingItem.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Item not found or does not belong to this hospital",
        },
        { status: 404 },
      )
    }

    // Delete the item
    await executeSQL(`DELETE FROM ${tableName} WHERE bag_id = $1 AND hospital_id = $2`, bagId, hospitalId)

    // Invalidate relevant cache
    queryCache.invalidate(`${type}:${hospitalId}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`Error deleting ${params.type} inventory item:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete inventory item",
      },
      { status: 500 },
    )
  }
}
