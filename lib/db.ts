import { neon } from "@neondatabase/serverless"
import { AppError, ErrorType } from "@/lib/error-handling"

// Initialize the database connection
const dbUrl = process.env.DATABASE_URL

// Create the neon client
const neonClient = dbUrl ? neon(dbUrl) : null

/**
 * Execute SQL query using tagged template literals
 * @param query The SQL query with parameters as ${param}
 * @returns Query result
 */
export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  try {
    // Check if database URL is available
    if (!neonClient) {
      console.error("DATABASE_URL environment variable is not set")
      throw new Error("DATABASE_URL environment variable is not set")
    }

    // Log the query for debugging (but not in production)
    if (process.env.NODE_ENV !== "production") {
      console.log("Executing SQL query:", strings.join("?"))
      console.log("SQL params:", values)
    }

    // Execute the query with timeout and retry
    let attempts = 0
    const maxAttempts = 3
    let lastError

    while (attempts < maxAttempts) {
      try {
        const result = await Promise.race([
          neonClient(strings, ...values),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Database query timeout")), 10000)),
        ])

        // Log the result for debugging (but not in production)
        if (process.env.NODE_ENV !== "production") {
          console.log("SQL result:", result)
        }

        return result
      } catch (error) {
        lastError = error
        attempts++
        console.error(`Database attempt ${attempts} failed:`, error)

        // Only retry on connection errors
        if (!(error instanceof Error && error.message.includes("connection"))) {
          break
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // If we get here, all attempts failed
    throw lastError
  } catch (error) {
    console.error("Database error:", error)

    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown database error"
    console.error("Database error details:", errorMessage)

    throw new AppError(`Database operation failed: ${errorMessage}`, ErrorType.DATABASE_CONNECTION, {
      query: strings.join("?"),
      params: values,
    })
  }
}

/**
 * Test database connection
 * @returns True if connection is successful
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as connection_test`
    return result.length > 0 && result[0].connection_test === 1
  } catch (error) {
    console.error("Database connection test failed:", error)
    return false
  }
}

/**
 * Search for donors based on a search term
 */
export async function searchDonors(searchTerm: string, showInactive: boolean) {
  try {
    // Execute the query using tagged template literals
    return await sql`
      SELECT * FROM donors
      WHERE (name ILIKE ${`%${searchTerm}%`} OR blood_type ILIKE ${`%${searchTerm}%`} OR contact ILIKE ${`%${searchTerm}%`})
      AND is_active = ${!showInactive}
      ORDER BY name
    `
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
    // Execute the query using tagged template literals
    await sql`
      UPDATE donors
      SET name = ${donor.name}, 
          blood_type = ${donor.blood_type}, 
          contact = ${donor.contact}, 
          date_of_birth = ${donor.date_of_birth}, 
          previous_donation = ${donor.previous_donation}
      WHERE id = ${donor.id}
    `
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
    // Execute the query using tagged template literals
    await sql`
      UPDATE donors
      SET is_active = false
      WHERE id = ${id}
    `
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
    // Execute the query using tagged template literals
    await sql`
      UPDATE donors
      SET is_active = true
      WHERE id = ${id}
    `
  } catch (error) {
    console.error("Error restoring donor:", error)
    throw new AppError("Failed to restore donor", ErrorType.DATABASE_CONNECTION)
  }
}
