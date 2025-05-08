import { neon } from "@neondatabase/serverless"
import { AppError, ErrorType, logError } from "./error-handling"

// Track connection errors for reporting
let CONNECTION_ERROR_MESSAGE = ""

// Flag to track if we're in fallback mode
export let IS_FALLBACK_MODE = false

// Function to get connection error message
export function getConnectionErrorMessage() {
  return CONNECTION_ERROR_MESSAGE
}

// Function to set connection error message
export function setConnectionErrorMessage(message: string) {
  CONNECTION_ERROR_MESSAGE = message
}

// Database connection configuration
const QUERY_TIMEOUT = 10000 // 10 seconds

// Function to validate and get the database URL
export function getDatabaseUrl() {
  // Try different environment variables in order of preference
  const possibleUrls = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ]

  // Find the first valid URL
  const dbUrl = possibleUrls.find((url) => url && url.startsWith("postgres"))

  if (!dbUrl) {
    throw new AppError(ErrorType.DATABASE_CONNECTION, "No valid database URL found in environment variables", {
      availableVars: Object.keys(process.env)
        .filter((key) => key.includes("DATABASE") || key.includes("POSTGRES"))
        .join(", "),
    })
  }

  return dbUrl
}

// Create SQL client with the database URL
export function createSqlClient() {
  try {
    const dbUrl = getDatabaseUrl()
    return neon(dbUrl)
  } catch (error) {
    throw logError(error, "Create SQL Client")
  }
}

// Execute a database query with timeout
export async function executeQuery(query, params = []) {
  try {
    const sql = createSqlClient()

    // Set a timeout for the query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new AppError(ErrorType.TIMEOUT, "Database query timed out", "Query execution exceeded timeout limit"))
      }, QUERY_TIMEOUT)
    })

    // Execute the query with timeout
    const queryPromise = sql`${query}${params}`
    const result = await Promise.race([queryPromise, timeoutPromise])

    return result
  } catch (error) {
    throw logError(error, "Execute Query")
  }
}

// Function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Check if DATABASE_URL is defined
    if (!process.env.DATABASE_URL) {
      setConnectionErrorMessage("DATABASE_URL environment variable is not defined")
      IS_FALLBACK_MODE = true
      return false
    }

    // Initialize the Neon database client
    const dbClient = neon(process.env.DATABASE_URL)

    // Test the connection with a simple query
    await dbClient`SELECT 1`

    // If the connection is successful, reset the error message
    setConnectionErrorMessage("")
    IS_FALLBACK_MODE = false
    return true
  } catch (error) {
    console.error("Database connection check failed:", error)
    IS_FALLBACK_MODE = true
    setConnectionErrorMessage(error instanceof Error ? error.message : String(error))
    return false
  }
}

// Initialize database connection on module load
checkDatabaseConnection()
  .then((connected) => {
    if (connected) {
      console.log("Database connection test successful")
      IS_FALLBACK_MODE = false
    } else {
      console.warn("Database connection failed. Application will show error messages to users.")
      IS_FALLBACK_MODE = true
    }
  })
  .catch((error) => {
    console.error("Unexpected error during database initialization:", error)
    setConnectionErrorMessage(error instanceof Error ? error.message : String(error))
    IS_FALLBACK_MODE = true
  })

// Initialize the neon client once with the best available URL
export const dbClient = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

// Test database connection
export async function testConnection() {
  try {
    const result = await executeQuery("SELECT NOW() as current_time")
    return {
      success: true,
      timestamp: result[0].current_time,
      message: "Database connection successful",
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.details || {},
      type: error instanceof AppError ? error.type : "UNKNOWN",
    }
  }
}

// Verify admin credentials
export async function verifyAdminCredentials(username, password) {
  try {
    const result = await dbClient`
      SELECT admin_id, hospital_id FROM admin 
      WHERE admin_username = ${username} AND admin_password = ${password}
    `

    return result[0] || null
  } catch (error) {
    // Log the error but don't expose it to the caller
    logError(error, "Verify Admin Credentials")
    return null
  }
}

// Register a new admin
export async function registerAdmin(username, password, hospitalId) {
  try {
    // Check if username already exists
    const usernameCheck = await dbClient`
      SELECT admin_id FROM admin WHERE admin_username = ${username}
    `

    if (usernameCheck.length > 0) {
      return {
        success: false,
        error: "Username already exists",
      }
    }

    // Insert new admin
    const result = await dbClient`
      INSERT INTO admin (admin_username, admin_password, hospital_id)
      VALUES (${username}, ${password}, ${hospitalId})
      RETURNING admin_id
    `

    if (result.length > 0) {
      return { success: true }
    } else {
      return {
        success: false,
        error: "Failed to create admin account",
      }
    }
  } catch (error) {
    console.error("Error registering admin:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Get hospital by ID
export async function getHospitalById(hospitalId) {
  try {
    const result = await dbClient`
      SELECT * FROM hospital WHERE hospital_id = ${hospitalId}
    `

    if (!result || result.length === 0) {
      throw new AppError(ErrorType.NOT_FOUND, "Hospital not found")
    }

    return result[0]
  } catch (error) {
    throw logError(error, "Get Hospital")
  }
}

// Get all hospitals
export async function getAllHospitals() {
  try {
    const hospitals = await dbClient`
      SELECT hospital_id, hospital_name 
      FROM hospital 
      ORDER BY hospital_name
    `

    return hospitals
  } catch (error) {
    throw logError(error, "Get All Hospitals")
  }
}

// Get blood inventory
export async function getBloodInventory(hospitalId) {
  try {
    const redBlood = await dbClient`
      SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM redblood_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh
    `

    return redBlood.map((item) => ({
      ...item,
      count: Number(item.count),
      total_amount: Number(item.total_amount),
    }))
  } catch (error) {
    throw logError(error, "Get Blood Inventory")
  }
}

// Get plasma inventory
export async function getPlasmaInventory(hospitalId) {
  try {
    const plasma = await dbClient`
      SELECT blood_type, COUNT(*) as count, SUM(amount) as total_amount
      FROM plasma_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
      GROUP BY blood_type
      ORDER BY blood_type
    `

    return plasma
  } catch (error) {
    throw logError(error, "Get Plasma Inventory")
  }
}

// Get platelets inventory
export async function getPlateletsInventory(hospitalId) {
  try {
    const platelets = await dbClient`
      SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM platelets_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh
    `

    return platelets.map((item) => ({
      ...item,
      count: Number(item.count || 0),
      total_amount: Number(item.total_amount || 0),
    }))
  } catch (error) {
    throw logError(error, "Get Platelets Inventory")
  }
}

// Add new red blood bag
export async function addNewRedBloodBag(
  donorName,
  amount,
  hospitalId,
  expirationDate,
  bloodType,
  rh,
  adminUsername,
  adminPassword,
) {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return {
        success: false,
        error: "Database connection error",
        type: ErrorType.DATABASE_CONNECTION,
      }
    }

    // Validate admin credentials
    const adminCheck = await verifyAdminCredentials(adminUsername, adminPassword)
    if (!adminCheck) {
      return {
        success: false,
        error: "Authentication failed",
        type: ErrorType.AUTHENTICATION,
      }
    }

    // Insert new red blood bag
    await dbClient`
      INSERT INTO redblood_inventory (
        donor_name, 
        amount, 
        hospital_id, 
        expiration_date, 
        blood_type, 
        rh, 
        active
      ) VALUES (
        ${donorName},
        ${amount},
        ${hospitalId},
        ${expirationDate}::date,
        ${bloodType},
        ${rh},
        true
      )
    `

    return { success: true }
  } catch (error) {
    console.error("Error adding red blood bag:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      type: error instanceof AppError ? error.type : ErrorType.SERVER,
    }
  }
}

// Add new plasma bag
export async function addNewPlasmaBag(
  donorName,
  amount,
  hospitalId,
  expirationDate,
  bloodType,
  adminUsername,
  adminPassword,
) {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return {
        success: false,
        error: "Database connection error",
        type: ErrorType.DATABASE_CONNECTION,
      }
    }

    // Validate admin credentials
    const adminCheck = await verifyAdminCredentials(adminUsername, adminPassword)
    if (!adminCheck) {
      return {
        success: false,
        error: "Authentication failed",
        type: ErrorType.AUTHENTICATION,
      }
    }

    // Insert new plasma bag
    await dbClient`
      INSERT INTO plasma_inventory (
        donor_name, 
        amount, 
        hospital_id, 
        expiration_date, 
        blood_type, 
        active
      ) VALUES (
        ${donorName},
        ${amount},
        ${hospitalId},
        ${expirationDate}::date,
        ${bloodType},
        true
      )
    `

    return { success: true }
  } catch (error) {
    console.error("Error adding plasma bag:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      type: error instanceof AppError ? error.type : ErrorType.SERVER,
    }
  }
}

// Add new platelets bag
export async function addNewPlateletsBag(
  donorName,
  amount,
  hospitalId,
  expirationDate,
  bloodType,
  rh,
  adminUsername,
  adminPassword,
) {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return {
        success: false,
        error: "Database connection error",
        type: ErrorType.DATABASE_CONNECTION,
      }
    }

    // Validate admin credentials
    const adminCheck = await verifyAdminCredentials(adminUsername, adminPassword)
    if (!adminCheck) {
      return {
        success: false,
        error: "Authentication failed",
        type: ErrorType.AUTHENTICATION,
      }
    }

    // Insert new platelets bag
    await dbClient`
      INSERT INTO platelets_inventory (
        donor_name, 
        amount, 
        hospital_id, 
        expiration_date, 
        blood_type, 
        rh, 
        active
      ) VALUES (
        ${donorName},
        ${amount},
        ${hospitalId},
        ${expirationDate}::date,
        ${bloodType},
        ${rh},
        true
      )
    `

    return { success: true }
  } catch (error) {
    console.error("Error adding platelets bag:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      type: error instanceof AppError ? error.type : ErrorType.SERVER,
    }
  }
}

// Search donors
export async function searchDonors(query) {
  if (!query || query.trim() === "") return []

  try {
    const searchTerm = `%${query}%`

    // Search by donor name
    const redBloodResults = await dbClient`
      SELECT 'RedBlood' as type, rb.bag_id, rb.donor_name, rb.blood_type, rb.rh, 
             rb.amount, rb.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM redblood_inventory rb
      JOIN hospital h ON rb.hospital_id = h.hospital_id
      WHERE rb.donor_name ILIKE ${searchTerm} AND rb.active = true
    `

    const plasmaResults = await dbClient`
      SELECT 'Plasma' as type, p.bag_id, p.donor_name, p.blood_type, '' as rh, 
             p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM plasma_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.donor_name ILIKE ${searchTerm} AND p.active = true
    `

    const plateletsResults = await dbClient`
      SELECT 'Platelets' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
             p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM platelets_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.donor_name ILIKE ${searchTerm} AND p.active = true
    `

    return [...redBloodResults, ...plasmaResults, ...plateletsResults]
  } catch (error) {
    throw logError(error, "Search Donors")
  }
}

// Get surplus alerts
export async function getSurplusAlerts(hospitalId) {
  try {
    // Get current hospital's inventory
    const currentHospitalInventory = await dbClient`
      SELECT 'RedBlood' as type, blood_type, rh, COUNT(*) as count
      FROM redblood_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
      GROUP BY blood_type, rh
      UNION ALL
      SELECT 'Plasma' as type, blood_type, '' as rh, COUNT(*) as count
      FROM plasma_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
      GROUP BY blood_type
      UNION ALL
      SELECT 'Platelets' as type, blood_type, rh, COUNT(*) as count
      FROM platelets_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
      GROUP BY blood_type, rh
    `

    // Get other hospitals with surplus
    const alerts = []

    for (const item of currentHospitalInventory) {
      const { type, blood_type, rh, count } = item

      // If current hospital has low stock (less than 5 units)
      if (Number(count) < 5) {
        let surplusHospitals

        if (type === "RedBlood") {
          surplusHospitals = await dbClient`
            SELECT h.hospital_id, h.hospital_name, COUNT(*) as count, 
                   h.hospital_contact_phone, h.hospital_contact_mail
            FROM redblood_inventory rb
            JOIN hospital h ON rb.hospital_id = h.hospital_id
            WHERE rb.hospital_id != ${hospitalId}
              AND rb.blood_type = ${blood_type}
              AND rb.rh = ${rh}
              AND rb.expiration_date > CURRENT_DATE
              AND rb.active = true
            GROUP BY h.hospital_id, h.hospital_name, h.hospital_contact_phone, h.hospital_contact_mail
            HAVING COUNT(*) > 10
            ORDER BY count DESC
          `
        } else if (type === "Plasma") {
          surplusHospitals = await dbClient`
            SELECT h.hospital_id, h.hospital_name, COUNT(*) as count,
                   h.hospital_contact_phone, h.hospital_contact_mail
            FROM plasma_inventory p
            JOIN hospital h ON p.hospital_id = h.hospital_id
            WHERE p.hospital_id != ${hospitalId}
              AND p.blood_type = ${blood_type}
              AND p.expiration_date > CURRENT_DATE
              AND p.active = true
            GROUP BY h.hospital_id, h.hospital_name, h.hospital_contact_phone, h.hospital_contact_mail
            HAVING COUNT(*) > 10
            ORDER BY count DESC
          `
        } else if (type === "Platelets") {
          surplusHospitals = await dbClient`
            SELECT h.hospital_id, h.hospital_name, COUNT(*) as count,
                   h.hospital_contact_phone, h.hospital_contact_mail
            FROM platelets_inventory p
            JOIN hospital h ON p.hospital_id = h.hospital_id
            WHERE p.hospital_id != ${hospitalId}
              AND p.blood_type = ${blood_type}
              AND p.rh = ${rh}
              AND p.expiration_date > CURRENT_DATE
              AND p.active = true
            GROUP BY h.hospital_id, h.hospital_name, h.hospital_contact_phone, h.hospital_contact_mail
            HAVING COUNT(*) > 10
            ORDER BY count DESC
          `
        }

        if (surplusHospitals && surplusHospitals.length > 0) {
          for (const hospital of surplusHospitals) {
            alerts.push({
              type,
              bloodType: blood_type,
              rh: rh || "",
              hospitalName: hospital.hospital_name,
              hospitalId: hospital.hospital_id,
              count: hospital.count,
              yourCount: count,
              contactPhone: hospital.hospital_contact_phone,
              contactEmail: hospital.hospital_contact_mail,
            })
          }
        }
      }
    }

    return alerts
  } catch (error) {
    throw logError(error, "Get Surplus Alerts")
  }
}

// Soft delete blood entry
export async function softDeleteBloodEntry(bagId, entryType, hospitalId) {
  try {
    let result

    if (entryType === "RedBlood") {
      result = await dbClient`
        UPDATE redblood_inventory
        SET active = false
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
    } else if (entryType === "Plasma") {
      result = await dbClient`
        UPDATE plasma_inventory
        SET active = false
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
    } else if (entryType === "Platelets") {
      result = await dbClient`
        UPDATE platelets_inventory
        SET active = false
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
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
    console.error("Error soft-deleting blood entry:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Function to get fallback mode status
export function isFallbackMode() {
  return IS_FALLBACK_MODE
}

export { checkDatabaseConnection as testDatabaseConnection }
