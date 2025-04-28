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

    // Build the WHERE clause based on filters with proper table aliases
    const conditions = []

    if (!showAllHospitals) {
      conditions.push(`rb.hospital_id = ${hospitalId}`)
    }

    if (bloodType) {
      conditions.push(`rb.blood_type = '${bloodType}'`)
    }

    if (rhFactor) {
      conditions.push(`rb.rh = '${rhFactor}'`)
    }

    if (expirationStatus === "valid") {
      conditions.push("rb.expiration_date > CURRENT_DATE")
    } else if (expirationStatus === "expired") {
      conditions.push("rb.expiration_date <= CURRENT_DATE")
    }

    // Construct the WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // Get raw inventory data with filters
    const rawInventoryQuery = `
      SELECT rb.*, h.hospital_name
      FROM redblood_inventory rb
      JOIN hospital h ON rb.hospital_id = h.hospital_id
      ${whereClause}
      ORDER BY rb.expiration_date DESC
      LIMIT ${limit}
    `
    const rawInventory = await dbClient.query(rawInventoryQuery)

    // For the aggregated and expired data queries, we need to add table aliases
    // Create conditions for these queries with proper table aliases
    const rbConditions = conditions.map((c) => {
      // If the condition already has rb. prefix, keep it as is
      if (c.startsWith("rb.")) return c
      // Otherwise, add rb. prefix to column names
      return c.replace(/blood_type|rh|expiration_date|hospital_id/g, (match) => `rb.${match}`)
    })

    // Get aggregated data with filters for non-expired blood
    const validConditions = [...rbConditions]
    if (expirationStatus !== "expired") {
      // If we're not already filtering for expired only, add the valid condition
      if (!validConditions.some((c) => c.includes("expiration_date"))) {
        validConditions.push("rb.expiration_date > CURRENT_DATE")
      }
    }
    const validWhereClause = validConditions.length > 0 ? `WHERE ${validConditions.join(" AND ")}` : ""

    const aggregatedDataQuery = `
      SELECT rb.blood_type, rb.rh, COUNT(*) as count, SUM(rb.amount) as total_amount
      FROM redblood_inventory rb
      ${validWhereClause}
      GROUP BY rb.blood_type, rb.rh
      ORDER BY rb.blood_type, rb.rh
    `
    const aggregatedData = await dbClient.query(aggregatedDataQuery)

    // Get expired data with filters
    const expiredConditions = [...rbConditions.filter((c) => !c.includes("expiration_date"))]
    expiredConditions.push("rb.expiration_date <= CURRENT_DATE")
    const expiredWhereClause = expiredConditions.length > 0 ? `WHERE ${expiredConditions.join(" AND ")}` : ""

    const expiredDataQuery = `
      SELECT rb.blood_type, rb.rh, COUNT(*) as count, SUM(rb.amount) as total_amount
      FROM redblood_inventory rb
      ${expiredWhereClause}
      GROUP BY rb.blood_type, rb.rh
      ORDER BY rb.blood_type, rb.rh
    `
    const expiredData = await dbClient.query(expiredDataQuery)

    // Get total counts with filters
    const totalCountsQuery = `
      SELECT 
        COUNT(*) as total_count,
        SUM(rb.amount) as total_amount,
        COUNT(*) FILTER (WHERE rb.expiration_date > CURRENT_DATE) as valid_count,
        SUM(rb.amount) FILTER (WHERE rb.expiration_date > CURRENT_DATE) as valid_amount
      FROM redblood_inventory rb
      ${whereClause}
    `
    const totalCounts = await dbClient.query(totalCountsQuery)

    // Get available hospitals for the filter dropdown
    const hospitalsQuery = `
      SELECT DISTINCT h.hospital_id, h.hospital_name
      FROM redblood_inventory rb
      JOIN hospital h ON rb.hospital_id = h.hospital_id
      ORDER BY h.hospital_name
    `
    const hospitals = await dbClient.query(hospitalsQuery)

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
