import { dbClient } from "./db"
import { queryCache } from "./cache"
import { logError } from "./error-handling"

// Function to restore a soft-deleted blood entry
export async function restoreBloodEntry(bagId: number, entryType: string, hospitalId: number) {
  try {
    // Verify that the entry belongs to the hospital
    const ownershipCheck = await verifyEntryOwnership(bagId, entryType, hospitalId)
    if (!ownershipCheck.success) {
      return ownershipCheck
    }

    // Restore the entry based on its type by setting active = true
    let result
    if (entryType === "RedBlood") {
      result = await dbClient`
        UPDATE redblood_inventory
        SET active = true
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
      // Invalidate cache
      queryCache.invalidate(`redblood:${hospitalId}`)
    } else if (entryType === "Plasma") {
      result = await dbClient`
        UPDATE plasma_inventory
        SET active = true
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
      // Invalidate cache
      queryCache.invalidate(`plasma:${hospitalId}`)
    } else if (entryType === "Platelets") {
      result = await dbClient`
        UPDATE platelets_inventory
        SET active = true
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
        error: "Failed to restore entry",
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

// Helper function to verify entry ownership
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
