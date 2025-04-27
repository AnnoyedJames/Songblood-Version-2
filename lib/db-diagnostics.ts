import { neon } from "@neondatabase/serverless"
import { logError } from "./error-handling"

/**
 * Utility function to directly query the red blood cell inventory
 * for diagnostic purposes
 */
export async function diagnoseRedBloodInventory(hospitalId: number) {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        success: false,
        error: "DATABASE_URL environment variable is not defined",
        data: null,
      }
    }

    const dbClient = neon(process.env.DATABASE_URL)

    // Get raw inventory data
    const rawInventory = await dbClient`
      SELECT * FROM redblood_inventory
      WHERE hospital_id = ${hospitalId}
      ORDER BY expiration_date DESC
    `

    // Get aggregated data
    const aggregatedData = await dbClient`
      SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM redblood_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh
    `

    // Get expired data
    const expiredData = await dbClient`
      SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM redblood_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date <= CURRENT_DATE
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh
    `

    // Get total counts
    const totalCounts = await dbClient`
      SELECT 
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        COUNT(*) FILTER (WHERE expiration_date > CURRENT_DATE) as valid_count,
        SUM(amount) FILTER (WHERE expiration_date > CURRENT_DATE) as valid_amount
      FROM redblood_inventory
      WHERE hospital_id = ${hospitalId}
    `

    return {
      success: true,
      data: {
        rawInventory: rawInventory.slice(0, 10), // First 10 records for sample
        aggregatedData,
        expiredData,
        totalCounts: totalCounts[0],
        currentDate: new Date().toISOString(),
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(error, "Diagnose Red Blood Inventory")

    return {
      success: false,
      error: errorMessage,
      data: null,
    }
  }
}
