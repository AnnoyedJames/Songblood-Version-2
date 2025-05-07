import { neon } from "@neondatabase/serverless"
import { AppError, ErrorType } from "@/lib/error-handling"

// Initialize the database connection
const dbUrl = process.env.DATABASE_URL

// Create a SQL query function with better error handling
export async function sql(query: string, ...params: any[]) {
  try {
    // Check if database URL is available
    if (!dbUrl) {
      console.error("DATABASE_URL environment variable is not set")
      throw new Error("DATABASE_URL environment variable is not set")
    }

    // Create a database client
    const client = neon(dbUrl)

    // Log the query for debugging (but not in production)
    if (process.env.NODE_ENV !== "production") {
      console.log("Executing SQL query:", query)
      console.log("SQL params:", params)
    }

    // Execute the query
    const result = await client(query, ...params)

    // Log the result for debugging (but not in production)
    if (process.env.NODE_ENV !== "production") {
      console.log("SQL result:", result)
    }

    return result
  } catch (error) {
    console.error("Database error:", error)

    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown database error"
    console.error("Database error details:", errorMessage)

    throw new AppError(`Database operation failed: ${errorMessage}`, ErrorType.DATABASE_CONNECTION, { query, params })
  }
}

/**
 * Search for donors based on a search term
 */
export async function searchDonors(searchTerm: string, showInactive: boolean) {
  try {
    // Construct the query
    const query = `
      SELECT * FROM donors
      WHERE (name ILIKE $1 OR blood_type ILIKE $1 OR contact ILIKE $1)
      AND is_active = $2
      ORDER BY name
    `
    const params = [`%${searchTerm}%`, !showInactive]

    // Execute the query
    return await sql(query, ...params)
  } catch (error) {
    console.error("Error searching donors:", error)
    throw new AppError("Failed to search donors", ErrorType.DATABASE_CONNECTION)
  }
}

/**
 * Update a donor's information
 */
export async function updateDonor(donor: any) {
  try {
    // Construct the query
    const query = `
      UPDATE donors
      SET name = $1, blood_type = $2, contact = $3, date_of_birth = $4, previous_donation = $5
      WHERE id = $6
    `
    const params = [donor.name, donor.blood_type, donor.contact, donor.date_of_birth, donor.previous_donation, donor.id]

    // Execute the query
    await sql(query, ...params)
  } catch (error) {
    console.error("Error updating donor:", error)
    throw new AppError("Failed to update donor", ErrorType.DATABASE_CONNECTION)
  }
}

/**
 * Soft delete a donor by setting is_active to false
 */
export async function softDeleteDonor(id: number) {
  try {
    // Construct the query
    const query = `
      UPDATE donors
      SET is_active = false
      WHERE id = $1
    `

    // Execute the query
    await sql(query, id)
  } catch (error) {
    console.error("Error soft deleting donor:", error)
    throw new AppError("Failed to delete donor", ErrorType.DATABASE_CONNECTION)
  }
}

/**
 * Restore a donor by setting is_active to true
 */
export async function restoreDonor(id: number) {
  try {
    // Construct the query
    const query = `
      UPDATE donors
      SET is_active = true
      WHERE id = $1
    `

    // Execute the query
    await sql(query, id)
  } catch (error) {
    console.error("Error restoring donor:", error)
    throw new AppError("Failed to restore donor", ErrorType.DATABASE_CONNECTION)
  }
}
