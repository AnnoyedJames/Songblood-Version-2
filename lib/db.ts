import { executeSQL } from "./db-connection"
import { queryCache } from "./cache"

// Helper function to get hospital data by ID
export async function getHospitalById(hospitalId: number) {
  try {
    const cacheKey = `hospital:${hospitalId}`
    const cached = queryCache.get(cacheKey)

    if (cached) {
      return cached
    }

    const result = await executeSQL(`SELECT * FROM hospital WHERE hospital_id = $1`, hospitalId)

    if (result[0]) {
      queryCache.set(cacheKey, result[0])
    }

    return result[0]
  } catch (error) {
    console.error("Error fetching hospital:", error)
    throw error
  }
}

// Helper function to verify admin credentials
export async function verifyAdminCredentials(username: string, password: string) {
  try {
    const result = await executeSQL(
      `SELECT admin_id, hospital_id FROM admin 
      WHERE admin_username = $1 AND admin_password = $2`,
      username,
      password,
    )
    return result[0] || null
  } catch (error) {
    console.error("Error verifying credentials:", error)
    throw error
  }
}

// Helper function to get blood inventory for a hospital
export async function getBloodInventory(hospitalId: number) {
  try {
    const cacheKey = `redblood:${hospitalId}`
    const cached = queryCache.get<any[]>(cacheKey)

    if (cached) {
      return cached
    }

    const redBlood = await executeSQL(
      `SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM redblood_inventory
      WHERE hospital_id = $1 AND expiration_date > CURRENT_DATE
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh`,
      hospitalId,
    )

    queryCache.set(cacheKey, redBlood)
    return redBlood
  } catch (error) {
    console.error("Error fetching blood inventory:", error)
    throw error
  }
}

// Helper function to get plasma inventory for a hospital
export async function getPlasmaInventory(hospitalId: number) {
  try {
    const cacheKey = `plasma:${hospitalId}`
    const cached = queryCache.get<any[]>(cacheKey)

    if (cached) {
      return cached
    }

    const plasma = await executeSQL(
      `SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM plasma_inventory
      WHERE hospital_id = $1 AND expiration_date > CURRENT_DATE
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh`,
      hospitalId,
    )

    queryCache.set(cacheKey, plasma)
    return plasma
  } catch (error) {
    console.error("Error fetching plasma inventory:", error)
    throw error
  }
}

// Helper function to get platelets inventory for a hospital
export async function getPlateletsInventory(hospitalId: number) {
  try {
    const cacheKey = `platelets:${hospitalId}`
    const cached = queryCache.get<any[]>(cacheKey)

    if (cached) {
      return cached
    }

    const platelets = await executeSQL(
      `SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM platelets_inventory
      WHERE hospital_id = $1 AND expiration_date > CURRENT_DATE
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh`,
      hospitalId,
    )

    queryCache.set(cacheKey, platelets)
    return platelets
  } catch (error) {
    console.error("Error fetching platelets inventory:", error)
    throw error
  }
}

// Helper function to get surplus alerts
export async function getSurplusAlerts(hospitalId: number) {
  try {
    // Get current hospital's inventory
    const currentHospitalInventory = await executeSQL(
      `SELECT 'RedBlood' as type, blood_type, rh, COUNT(*) as count
      FROM redblood_inventory
      WHERE hospital_id = $1 AND expiration_date > CURRENT_DATE
      GROUP BY blood_type, rh
      UNION ALL
      SELECT 'Plasma' as type, blood_type, rh, COUNT(*) as count
      FROM plasma_inventory
      WHERE hospital_id = $1 AND expiration_date > CURRENT_DATE
      GROUP BY blood_type, rh
      UNION ALL
      SELECT 'Platelets' as type, blood_type, rh, COUNT(*) as count
      FROM platelets_inventory
      WHERE hospital_id = $1 AND expiration_date > CURRENT_DATE
      GROUP BY blood_type, rh`,
      hospitalId,
    )

    // Get other hospitals with surplus
    const alerts = []

    for (const item of currentHospitalInventory) {
      const { type, blood_type, rh, count } = item

      // If current hospital has low stock (less than 5 units)
      if (Number(count) < 5) {
        let surplusHospitals

        if (type === "RedBlood") {
          surplusHospitals = await executeSQL(
            `SELECT h.hospital_id, h.hospital_name, h.hospital_contact_phone, COUNT(*) as count
            FROM redblood_inventory rb
            JOIN hospital h ON rb.hospital_id = h.hospital_id
            WHERE rb.hospital_id != $1
              AND rb.blood_type = $2
              AND rb.rh = $3
              AND rb.expiration_date > CURRENT_DATE
            GROUP BY h.hospital_id, h.hospital_name, h.hospital_contact_phone
            HAVING COUNT(*) > 10
            ORDER BY count DESC`,
            hospitalId,
            blood_type,
            rh,
          )
        } else if (type === "Plasma") {
          surplusHospitals = await executeSQL(
            `SELECT h.hospital_id, h.hospital_name, h.hospital_contact_phone, COUNT(*) as count
            FROM plasma_inventory p
            JOIN hospital h ON p.hospital_id = h.hospital_id
            WHERE p.hospital_id != $1
              AND p.blood_type = $2
              AND p.rh = $3
              AND p.expiration_date > CURRENT_DATE
            GROUP BY h.hospital_id, h.hospital_name, h.hospital_contact_phone
            HAVING COUNT(*) > 10
            ORDER BY count DESC`,
            hospitalId,
            blood_type,
            rh,
          )
        } else if (type === "Platelets") {
          surplusHospitals = await executeSQL(
            `SELECT h.hospital_id, h.hospital_name, h.hospital_contact_phone, COUNT(*) as count
            FROM platelets_inventory p
            JOIN hospital h ON p.hospital_id = h.hospital_id
            WHERE p.hospital_id != $1
              AND p.blood_type = $2
              AND p.rh = $3
              AND p.expiration_date > CURRENT_DATE
            GROUP BY h.hospital_id, h.hospital_name, h.hospital_contact_phone
            HAVING COUNT(*) > 10
            ORDER BY count DESC`,
            hospitalId,
            blood_type,
            rh,
          )
        }

        if (surplusHospitals && surplusHospitals.length > 0) {
          for (const hospital of surplusHospitals) {
            alerts.push({
              type,
              bloodType: blood_type,
              rh: rh || "",
              hospitalName: hospital.hospital_name,
              hospitalId: hospital.hospital_id,
              hospitalPhone: hospital.hospital_contact_phone,
              count: hospital.count,
              yourCount: count,
            })
          }
        }
      }
    }

    return alerts
  } catch (error) {
    console.error("Error fetching surplus alerts:", error)
    throw error
  }
}

// Helper function to search for donors
export async function searchDonors(query: string) {
  if (!query || query.trim() === "") return []

  try {
    const searchTerm = `%${query}%`

    // Search by bag ID if the query is a number
    if (!isNaN(Number(query))) {
      const bagId = Number(query)

      const redBloodResults = await executeSQL(
        `SELECT 'RedBlood' as type, rb.bag_id, rb.donor_name, rb.blood_type, rb.rh, 
               rb.amount, rb.expiration_date, h.hospital_name, h.hospital_contact_phone
        FROM redblood_inventory rb
        JOIN hospital h ON rb.hospital_id = h.hospital_id
        WHERE rb.bag_id = $1`,
        bagId,
      )

      const plasmaResults = await executeSQL(
        `SELECT 'Plasma' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
               p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
        FROM plasma_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.bag_id = $1`,
        bagId,
      )

      const plateletsResults = await executeSQL(
        `SELECT 'Platelets' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
               p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
        FROM platelets_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.bag_id = $1`,
        bagId,
      )

      return [...redBloodResults, ...plasmaResults, ...plateletsResults]
    }

    // Search by donor name
    const redBloodResults = await executeSQL(
      `SELECT 'RedBlood' as type, rb.bag_id, rb.donor_name, rb.blood_type, rb.rh, 
             rb.amount, rb.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM redblood_inventory rb
      JOIN hospital h ON rb.hospital_id = h.hospital_id
      WHERE rb.donor_name ILIKE $1`,
      searchTerm,
    )

    const plasmaResults = await executeSQL(
      `SELECT 'Plasma' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
             p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM plasma_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.donor_name ILIKE $1`,
      searchTerm,
    )

    const plateletsResults = await executeSQL(
      `SELECT 'Platelets' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
             p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM platelets_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.donor_name ILIKE $1`,
      searchTerm,
    )

    return [...redBloodResults, ...plasmaResults, ...plateletsResults]
  } catch (error) {
    console.error("Error searching donors:", error)
    throw error
  }
}

// Helper function to add new plasma bag
export async function addNewPlasmaBag(
  donorName: string,
  amount: number,
  hospitalId: number,
  expirationDate: string,
  bloodType: string,
  rh: string,
  adminUsername: string,
  adminPassword: string,
) {
  try {
    await executeSQL(
      `SELECT Add_New_PlasmaBag($1, $2, $3, $4::date, $5, $6, $7, $8)`,
      donorName,
      amount,
      hospitalId,
      expirationDate,
      bloodType,
      rh,
      adminUsername,
      adminPassword,
    )

    // Invalidate relevant caches
    queryCache.invalidate(`plasma:${hospitalId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error adding plasma bag:", error)
    return { success: false, error: error.message || "Failed to add plasma bag" }
  }
}

// Helper function to add new platelets bag
export async function addNewPlateletsBag(
  donorName: string,
  amount: number,
  hospitalId: number,
  expirationDate: string,
  bloodType: string,
  rh: string,
  adminUsername: string,
  adminPassword: string,
) {
  try {
    await executeSQL(
      `SELECT Add_New_PlateletsBag($1, $2, $3, $4::date, $5, $6, $7, $8)`,
      donorName,
      amount,
      hospitalId,
      expirationDate,
      bloodType,
      rh,
      adminUsername,
      adminPassword,
    )

    // Invalidate relevant caches
    queryCache.invalidate(`platelets:${hospitalId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error adding platelets bag:", error)
    return { success: false, error: error.message || "Failed to add platelets bag" }
  }
}

// Add this function to the existing db.ts file
export async function registerAdmin(username: string, password: string, hospitalId: number) {
  try {
    // First check if the hospital exists
    const hospitalCheck = await executeSQL(`SELECT hospital_id FROM hospital WHERE hospital_id = $1`, hospitalId)

    if (hospitalCheck.length === 0) {
      return { success: false, error: "Hospital not found" }
    }

    // Check if username already exists
    const usernameCheck = await executeSQL(`SELECT admin_id FROM admin WHERE admin_username = $1`, username)

    if (usernameCheck.length > 0) {
      return { success: false, error: "Username already exists" }
    }

    // Insert new admin
    const result = await executeSQL(
      `INSERT INTO admin (admin_username, admin_password, hospital_id)
      VALUES ($1, $2, $3)
      RETURNING admin_id`,
      username,
      password,
      hospitalId,
    )

    if (result.length > 0) {
      return { success: true }
    } else {
      return { success: false, error: "Failed to create admin account" }
    }
  } catch (error) {
    console.error("Error registering admin:", error)
    return { success: false, error: "Database error. Please try again later." }
  }
}

// Export the checkDatabaseConnection function from db-connection.ts
export { checkDatabaseConnection } from "./db-connection"

export function isFallbackMode(): boolean {
  return false
}
