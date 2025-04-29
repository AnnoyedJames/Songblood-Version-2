import { neon } from "@neondatabase/serverless"
import { logError } from "./error-handling"
import { dbClient } from "./db"
import { queryCache } from "./cache"

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

interface UpdateBloodEntryParams {
  bagId: number
  entryType: string
  donorName: string
  amount: number
  expirationDate: string
  hospitalId: number
}

export async function updateBloodEntry({
  bagId,
  entryType,
  donorName,
  amount,
  expirationDate,
  hospitalId,
}: UpdateBloodEntryParams) {
  try {
    // Verify that the entry belongs to the hospital
    const ownershipCheck = await verifyEntryOwnership(bagId, entryType, hospitalId)
    if (!ownershipCheck.success) {
      return ownershipCheck
    }

    // Format the expiration date
    const formattedDate = new Date(expirationDate).toISOString().split("T")[0]

    // Update the entry based on its type
    let result
    if (entryType === "RedBlood") {
      result = await dbClient`
        UPDATE redblood_inventory
        SET donor_name = ${donorName}, amount = ${amount}, expiration_date = ${formattedDate}::date
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
      // Invalidate cache
      queryCache.invalidate(`redblood:${hospitalId}`)
    } else if (entryType === "Plasma") {
      result = await dbClient`
        UPDATE plasma_inventory
        SET donor_name = ${donorName}, amount = ${amount}, expiration_date = ${formattedDate}::date
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
      // Invalidate cache
      queryCache.invalidate(`plasma:${hospitalId}`)
    } else if (entryType === "Platelets") {
      result = await dbClient`
        UPDATE platelets_inventory
        SET donor_name = ${donorName}, amount = ${amount}, expiration_date = ${formattedDate}::date
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
      // Invalidate cache
      queryCache.invalidate(`platelets:${hospitalId}`)
    } else {
      return {
        success: false,
        error: "Invalid entry type",
      }
    }

    if (result && result.length > 0) {
      return { success: true }
    } else {
      return {
        success: false,
        error: "Failed to update entry",
      }
    }
  } catch (error) {
    console.error("Error updating blood entry:", error)
    const appError = logError(error, "Update Blood Entry")
    return {
      success: false,
      error: appError.message,
      details: appError.details,
    }
  }
}

export async function deleteBloodEntry(bagId: number, entryType: string, hospitalId: number) {
  try {
    // Verify that the entry belongs to the hospital
    const ownershipCheck = await verifyEntryOwnership(bagId, entryType, hospitalId)
    if (!ownershipCheck.success) {
      return ownershipCheck
    }

    // Delete the entry based on its type
    let result
    if (entryType === "RedBlood") {
      result = await dbClient`
        DELETE FROM redblood_inventory
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
      // Invalidate cache
      queryCache.invalidate(`redblood:${hospitalId}`)
    } else if (entryType === "Plasma") {
      result = await dbClient`
        DELETE FROM plasma_inventory
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
      // Invalidate cache
      queryCache.invalidate(`plasma:${hospitalId}`)
    } else if (entryType === "Platelets") {
      result = await dbClient`
        DELETE FROM platelets_inventory
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
      // Invalidate cache
      queryCache.invalidate(`platelets:${hospitalId}`)
    } else {
      return {
        success: false,
        error: "Invalid entry type",
      }
    }

    if (result && result.length > 0) {
      return { success: true }
    } else {
      return {
        success: false,
        error: "Failed to delete entry",
      }
    }
  } catch (error) {
    console.error("Error deleting blood entry:", error)
    const appError = logError(error, "Delete Blood Entry")
    return {
      success: false,
      error: appError.message,
      details: appError.details,
    }
  }
}

async function verifyEntryOwnership(bagId: number, entryType: string, hospitalId: number) {
  try {
    let result
    if (entryType === "RedBlood") {
      result = await dbClient`
        SELECT hospital_id FROM redblood_inventory WHERE bag_id = ${bagId}
      `
    } else if (entryType === "Plasma") {
      result = await dbClient`
        SELECT hospital_id FROM plasma_inventory WHERE bag_id = ${bagId}
      `
    } else if (entryType === "Platelets") {
      result = await dbClient`
        SELECT hospital_id FROM platelets_inventory WHERE bag_id = ${bagId}
      `
    } else {
      return {
        success: false,
        error: "Invalid entry type",
      }
    }

    if (!result || result.length === 0) {
      return {
        success: false,
        error: "Entry not found",
      }
    }

    if (result[0].hospital_id !== hospitalId) {
      return {
        success: false,
        error: "You don't have permission to modify this entry",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error verifying entry ownership:", error)
    const appError = logError(error, "Verify Entry Ownership")
    return {
      success: false,
      error: appError.message,
      details: appError.details,
    }
  }
}
