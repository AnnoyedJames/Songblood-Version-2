import { dbClient } from "./db"
import { queryCache } from "./cache"
import { logError } from "./error-handling"

/**
 * Utility function to restore a soft-deleted blood inventory entry
 */
export async function restoreBloodEntry(bagId: number, entryType: string, hospitalId: number) {
  try {
    // Restore the entry based on its type by setting active = true
    let result
    if (entryType === "RedBlood") {
      result = await dbClient`
        UPDATE redblood_inventory
        SET active = true
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId} AND active = false
        RETURNING bag_id
      `
      // Invalidate cache
      queryCache.invalidate(`redblood:${hospitalId}`)
    } else if (entryType === "Plasma") {
      result = await dbClient`
        UPDATE plasma_inventory
        SET active = true
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId} AND active = false
        RETURNING bag_id
      `
      // Invalidate cache
      queryCache.invalidate(`plasma:${hospitalId}`)
    } else if (entryType === "Platelets") {
      result = await dbClient`
        UPDATE platelets_inventory
        SET active = true
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId} AND active = false
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
        error: "Failed to restore entry or entry not found",
      }
    }
  } catch (error) {
    console.error("Error restoring blood entry:", error)
    const appError = logError(error, "Restore Blood Entry")
    return {
      success: false,
      error: appError.message,
      details: appError.details,
    }
  }
}

/**
 * Utility function to list soft-deleted entries for potential restoration
 */
export async function listDeletedEntries(hospitalId: number, entryType?: string) {
  try {
    const queries = []

    if (!entryType || entryType === "RedBlood") {
      queries.push(dbClient`
        SELECT 'RedBlood' as type, bag_id, donor_name, blood_type, rh, amount, expiration_date
        FROM redblood_inventory
        WHERE hospital_id = ${hospitalId} AND active = false
        ORDER BY expiration_date DESC
      `)
    }

    if (!entryType || entryType === "Plasma") {
      queries.push(dbClient`
        SELECT 'Plasma' as type, bag_id, donor_name, blood_type, '' as rh, amount, expiration_date
        FROM plasma_inventory
        WHERE hospital_id = ${hospitalId} AND active = false
        ORDER BY expiration_date DESC
      `)
    }

    if (!entryType || entryType === "Platelets") {
      queries.push(dbClient`
        SELECT 'Platelets' as type, bag_id, donor_name, blood_type, rh, amount, expiration_date
        FROM platelets_inventory
        WHERE hospital_id = ${hospitalId} AND active = false
        ORDER BY expiration_date DESC
      `)
    }

    const results = await Promise.all(queries)

    // Combine all results
    const deletedEntries = results.flat()

    return {
      success: true,
      data: deletedEntries,
    }
  } catch (error) {
    console.error("Error listing deleted entries:", error)
    const appError = logError(error, "List Deleted Entries")
    return {
      success: false,
      error: appError.message,
      details: appError.details,
    }
  }
}
