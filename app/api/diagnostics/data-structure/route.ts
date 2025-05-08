import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getBloodInventory, getPlasmaInventory, getPlateletsInventory } from "@/lib/db"

export async function GET() {
  try {
    // Check authentication
    const session = await requireAuth()
    const { hospitalId } = session

    // Get all inventory data
    const [redBlood, plasma, platelets] = await Promise.all([
      getBloodInventory(hospitalId),
      getPlasmaInventory(hospitalId),
      getPlateletsInventory(hospitalId),
    ])

    // Create a diagnostic report
    const report = {
      redBlood: {
        count: redBlood.length,
        sample: redBlood.length > 0 ? redBlood[0] : null,
        types: [...new Set(redBlood.map((item) => item.blood_type))],
        countType: redBlood.length > 0 ? typeof redBlood[0].count : null,
        totalAmountType: redBlood.length > 0 ? typeof redBlood[0].total_amount : null,
      },
      plasma: {
        count: plasma.length,
        sample: plasma.length > 0 ? plasma[0] : null,
        types: [...new Set(plasma.map((item) => item.blood_type))],
        countType: plasma.length > 0 ? typeof plasma[0].count : null,
        totalAmountType: plasma.length > 0 ? typeof plasma[0].total_amount : null,
      },
      platelets: {
        count: platelets.length,
        sample: platelets.length > 0 ? platelets[0] : null,
        types: [...new Set(platelets.map((item) => item.blood_type))],
        countType: platelets.length > 0 ? typeof platelets[0].count : null,
        totalAmountType: platelets.length > 0 ? typeof platelets[0].total_amount : null,
      },
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error generating data structure report:", error)
    return NextResponse.json({ error: "Failed to generate data structure report" }, { status: 500 })
  }
}
