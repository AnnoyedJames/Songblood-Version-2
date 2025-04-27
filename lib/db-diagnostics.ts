import { neon } from "@neondatabase/serverless"
import { logError } from "./error-handling"

type DiagnosticFilters = {
  hospitalId: number
  showAllHospitals?: boolean
  bloodType?: string
  rhFactor?: string
  expirationStatus?: "all" | "valid" | "expired"
  limit?: number
}

/**
 * Utility function to directly query the red blood cell inventory
 * for diagnostic purposes with filtering capabilities
 */
export async function diagnoseRedBloodInventory(filters: DiagnosticFilters) {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        success: false,
        error: "DATABASE_URL environment variable is not defined",
        data: null,
      }
    }

    const dbClient = neon(process.env.DATABASE_URL)
    const { hospitalId, showAllHospitals, bloodType, rhFactor, expirationStatus = "all", limit = 100 } = filters

    // Build the WHERE clause based on filters
    const hospitalCondition = showAllHospitals ? "" : `hospital_id = ${hospitalId} AND`
    const bloodTypeCondition = bloodType ? `blood_type = '${bloodType}' AND` : ""
    const rhFactorCondition = rhFactor ? `rh = '${rhFactor}' AND` : ""
    let expirationCondition = ""

    if (expirationStatus === "valid") {
      expirationCondition = "expiration_date > CURRENT_DATE AND"
    } else if (expirationStatus === "expired") {
      expirationCondition = "expiration_date <= CURRENT_DATE AND"
    }

    // Remove trailing AND if present
    const whereClause = `WHERE ${hospitalCondition} ${bloodTypeCondition} ${rhFactorCondition} ${expirationCondition}`
      .replace(/AND\s*$/, "")
      .trim()
    const finalWhereClause = whereClause === "WHERE" ? "" : whereClause

    // Get raw inventory data with filters
    const rawInventory = await dbClient`
      SELECT rb.*, h.hospital_name
      FROM redblood_inventory rb
      JOIN hospital h ON rb.hospital_id = h.hospital_id
      ${finalWhereClause ? dbClient.raw(finalWhereClause) : dbClient.raw("")}
      ORDER BY expiration_date DESC
      LIMIT ${limit}
    `

    // Get aggregated data with filters for non-expired blood
    const validWhereClause = `${finalWhereClause} ${finalWhereClause ? "AND" : "WHERE"} expiration_date > CURRENT_DATE`

    const aggregatedData = await dbClient`
      SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM redblood_inventory
      ${validWhereClause ? dbClient.raw(validWhereClause) : dbClient.raw("WHERE expiration_date > CURRENT_DATE")}
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh
    `

    // Get expired data with filters
    const expiredWhereClause = `${finalWhereClause} ${finalWhereClause ? "AND" : "WHERE"} expiration_date <= CURRENT_DATE`

    const expiredData = await dbClient`
      SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM redblood_inventory
      ${expiredWhereClause ? dbClient.raw(expiredWhereClause) : dbClient.raw("WHERE expiration_date <= CURRENT_DATE")}
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh
    `

    // Get total counts with filters
    const totalCounts = await dbClient`
      SELECT 
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        COUNT(*) FILTER (WHERE expiration_date > CURRENT_DATE) as valid_count,
        SUM(amount) FILTER (WHERE expiration_date > CURRENT_DATE) as valid_amount
      FROM redblood_inventory
      ${finalWhereClause ? dbClient.raw(finalWhereClause) : dbClient.raw("")}
    `

    // Get available hospitals for the filter dropdown
    const hospitals = await dbClient`
      SELECT DISTINCT h.hospital_id, h.hospital_name
      FROM redblood_inventory rb
      JOIN hospital h ON rb.hospital_id = h.hospital_id
      ORDER BY h.hospital_name
    `

    return {
      success: true,
      data: {
        rawInventory,
        aggregatedData,
        expiredData,
        totalCounts: totalCounts[0],
        currentDate: new Date().toISOString(),
        hospitals,
        appliedFilters: {
          hospitalId: showAllHospitals ? null : hospitalId,
          bloodType,
          rhFactor,
          expirationStatus,
        },
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
