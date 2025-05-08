import { neon } from "@neondatabase/serverless"

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
      throw new Error("DATABASE_URL environment variable is not set")
    }

    // Execute the query with parameterized values for security
    return await neonClient(strings, ...values)
  } catch (error) {
    console.error("Database error:", error)
    throw error
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
 * Searches donors based on the provided query
 */
export async function searchDonors(query: string, showInactive: boolean) {
  try {
    // Use parameterized queries for security
    let results

    if (showInactive) {
      results = await sql`
        SELECT 
          'RedBlood' as type, bag_id, donor_name, blood_type, rh, amount, expiration_date, h.name as hospital_name, hospital_id, active
        FROM redblood_inventory r JOIN hospitals h ON r.hospital_id = h.id
        WHERE donor_name ILIKE ${"%" + query + "%"}
        
        UNION ALL
        
        SELECT 
          'Plasma' as type, bag_id, donor_name, blood_type, '' as rh, amount, expiration_date, h.name as hospital_name, hospital_id, active
        FROM plasma_inventory p JOIN hospitals h ON p.hospital_id = h.id
        WHERE donor_name ILIKE ${"%" + query + "%"}
        
        UNION ALL
        
        SELECT 
          'Platelets' as type, bag_id, donor_name, blood_type, rh, amount, expiration_date, h.name as hospital_name, hospital_id, active
        FROM platelets_inventory pl JOIN hospitals h ON pl.hospital_id = h.id
        WHERE donor_name ILIKE ${"%" + query + "%"}
        
        ORDER BY donor_name
      `
    } else {
      results = await sql`
        SELECT 
          'RedBlood' as type, bag_id, donor_name, blood_type, rh, amount, expiration_date, h.name as hospital_name, hospital_id, active
        FROM redblood_inventory r JOIN hospitals h ON r.hospital_id = h.id
        WHERE donor_name ILIKE ${"%" + query + "%"} AND active = true
        
        UNION ALL
        
        SELECT 
          'Plasma' as type, bag_id, donor_name, blood_type, '' as rh, amount, expiration_date, h.name as hospital_name, hospital_id, active
        FROM plasma_inventory p JOIN hospitals h ON p.hospital_id = h.id
        WHERE donor_name ILIKE ${"%" + query + "%"} AND active = true
        
        UNION ALL
        
        SELECT 
          'Platelets' as type, bag_id, donor_name, blood_type, rh, amount, expiration_date, h.name as hospital_name, hospital_id, active
        FROM platelets_inventory pl JOIN hospitals h ON pl.hospital_id = h.id
        WHERE donor_name ILIKE ${"%" + query + "%"} AND active = true
        
        ORDER BY donor_name
      `
    }

    return results
  } catch (error) {
    console.error("Error searching donors:", error)
    throw error
  }
}
