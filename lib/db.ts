import { neon, neonConfig } from "@neondatabase/serverless"
import { queryCache } from "./cache"
import { AppError, ErrorType, logError } from "./error-handling"
import { configureNeon } from "./db-config"

// Configure Neon with optimal settings
neonConfig.fetchRetryTimeout = 5000 // 5 seconds timeout
neonConfig.fetchRetryCount = 2 // Retry twice
neonConfig.wsConnectionTimeoutMs = 5000 // 5 seconds WebSocket timeout

// Initialize Neon configuration
configureNeon()

// Sample data for fallback mode when database is unavailable
const FALLBACK_DATA = {
  hospitals: [
    {
      hospital_id: 1,
      hospital_name: "โรงพยาบาลจุฬาลงกรณ์",
      hospital_contact_mail: "info@chulalongkornhospital.go.th",
      hospital_contact_phone: "02-256-4000",
    },
    {
      hospital_id: 2,
      hospital_name: "โรงพยาบาลศิริราช",
      hospital_contact_mail: "info@sirirajhospital.com",
      hospital_contact_phone: "02-419-7000",
    },
  ],
  admins: [
    { admin_id: 1, admin_username: "Panya", admin_password: "P9aDhR8e", hospital_id: 1 },
    { admin_id: 2, admin_username: "Manasnan", admin_password: "M7nA7sL1k", hospital_id: 2 },
    { admin_id: 3, admin_username: "demo", admin_password: "demo", hospital_id: 1 },
  ],
}

// Flag to track if we're in fallback mode
let IS_FALLBACK_MODE = false

// Track connection errors for reporting
let CONNECTION_ERROR_MESSAGE = ""

// Create a SQL client with proper error handling
// Initialize the neon client once
const dbClient = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

export const sql = async (query: string, ...args: any[]) => {
  try {
    // Check if DATABASE_URL is defined
    if (!process.env.DATABASE_URL || !dbClient) {
      CONNECTION_ERROR_MESSAGE = "Database connection string is missing"
      throw new AppError(
        ErrorType.DATABASE_CONNECTION,
        "Database connection string is missing",
        "DATABASE_URL environment variable is not defined",
      )
    }

    // Add timeout to prevent hanging connections
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        CONNECTION_ERROR_MESSAGE = "Database query timed out"
        reject(
          new AppError(
            ErrorType.DATABASE_CONNECTION,
            "Database query timed out",
            "Query execution exceeded timeout limit",
          ),
        )
      }, 5000)
    })

    try {
      // Use the tagged template literal syntax for the query
      // Race the database query against the timeout
      return (await Promise.race([dbClient.query(query, args), timeoutPromise])) as any[]
    } catch (fetchError) {
      // Handle fetch errors specifically
      CONNECTION_ERROR_MESSAGE =
        fetchError instanceof Error
          ? `Error connecting to database: ${fetchError.message}`
          : "Failed to connect to database"

      console.error("Database connection error:", fetchError)
      throw new AppError(
        ErrorType.DATABASE_CONNECTION,
        "Failed to connect to database",
        fetchError instanceof Error ? fetchError.message : String(fetchError),
      )
    }
  } catch (error) {
    if (error instanceof Error) {
      CONNECTION_ERROR_MESSAGE = `Error connecting to database: ${error.message}`
    }

    // Convert and log the error
    const appError = logError(error, "Database Query")

    // Rethrow the error to be handled by the caller
    throw appError
  }
}

// Function to test database connection
export async function testDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    // Check if DATABASE_URL is defined
    if (!process.env.DATABASE_URL) {
      CONNECTION_ERROR_MESSAGE = "Database connection string is missing"
      return {
        connected: false,
        error: "Database connection string is missing",
      }
    }

    // Create a direct neon client for testing only
    const testClient = neon(process.env.DATABASE_URL)

    // Use a timeout promise to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Database connection timed out"))
      }, 5000)
    })

    try {
      // Use the tagged template literal syntax for the query
      // Race the database query against the timeout
      await Promise.race([testClient`SELECT 1 as connection_test`, timeoutPromise])
      return { connected: true }
    } catch (fetchError) {
      // Handle fetch errors specifically
      const errorMessage =
        fetchError instanceof Error
          ? `Database connection error: ${fetchError.message}`
          : "Failed to connect to database"

      CONNECTION_ERROR_MESSAGE = errorMessage
      console.error("Database connection test failed:", fetchError)

      return {
        connected: false,
        error: errorMessage,
      }
    }
  } catch (error) {
    // Handle any other errors
    const errorMessage = error instanceof Error ? error.message : "Unknown database connection error"

    CONNECTION_ERROR_MESSAGE = errorMessage
    console.error("Database connection test error:", error)

    return {
      connected: false,
      error: errorMessage,
    }
  }
}

// Initialize database connection on module load
testDatabaseConnection()
  .then(({ connected, error }) => {
    if (!connected) {
      console.warn(`Database connection failed: ${error}. Application will show error messages to users.`)
      CONNECTION_ERROR_MESSAGE = error || "Failed to connect to database"
    }
  })
  .catch((error) => {
    console.error("Unexpected error during database initialization:", error)
    CONNECTION_ERROR_MESSAGE = error instanceof Error ? error.message : String(error)
  })

// Helper function to get hospital data by ID
export async function getHospitalById(hospitalId: number) {
  try {
    const cacheKey = `hospital:${hospitalId}`
    const cached = queryCache.get(cacheKey)

    if (cached) {
      return cached
    }

    // Use tagged template literal syntax
    const result = await dbClient`
      SELECT * FROM hospital WHERE hospital_id = ${hospitalId}
    `

    if (!result || result.length === 0) {
      throw new AppError(ErrorType.NOT_FOUND, "Hospital not found")
    }

    queryCache.set(cacheKey, result[0])
    return result[0]
  } catch (error) {
    throw logError(error, "Get Hospital")
  }
}

// Helper function to verify admin credentials
export async function verifyAdminCredentials(username: string, password: string) {
  try {
    // Use tagged template literal syntax
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

// Helper function to get blood inventory for a hospital
export async function getBloodInventory(hospitalId: number) {
  try {
    const cacheKey = `redblood:${hospitalId}`
    const cached = queryCache.get<any[]>(cacheKey)

    if (cached) {
      console.log("Using cached red blood cell data:", cached)
      return cached
    }

    // Use tagged template literal syntax
    const redBlood = await dbClient`
      SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM redblood_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh
    `

    console.log("Retrieved red blood cell data from DB:", redBlood)

    // Ensure numeric values are properly parsed
    const processedData = redBlood.map((item) => ({
      ...item,
      count: Number(item.count),
      total_amount: Number(item.total_amount),
    }))

    queryCache.set(cacheKey, processedData)
    return processedData
  } catch (error) {
    throw logError(error, "Get Blood Inventory")
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

    // Use tagged template literal syntax
    const plasma = await dbClient`
      SELECT blood_type, COUNT(*) as count, SUM(amount) as total_amount
      FROM plasma_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
      GROUP BY blood_type
      ORDER BY blood_type
    `

    queryCache.set(cacheKey, plasma)
    return plasma
  } catch (error) {
    throw logError(error, "Get Plasma Inventory")
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

    // Use tagged template literal syntax
    const platelets = await dbClient`
      SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM platelets_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh
    `

    queryCache.set(cacheKey, platelets)
    return platelets
  } catch (error) {
    throw logError(error, "Get Platelets Inventory")
  }
}

// Helper function to get surplus alerts
export async function getSurplusAlerts(hospitalId: number) {
  try {
    // Get current hospital's inventory
    // Use tagged template literal syntax
    const currentHospitalInventory = await dbClient`
      SELECT 'RedBlood' as type, blood_type, rh, COUNT(*) as count
      FROM redblood_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
      GROUP BY blood_type, rh
      UNION ALL
      SELECT 'Plasma' as type, blood_type, '' as rh, COUNT(*) as count
      FROM plasma_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
      GROUP BY blood_type
      UNION ALL
      SELECT 'Platelets' as type, blood_type, rh, COUNT(*) as count
      FROM platelets_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
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
          // Use tagged template literal syntax
          surplusHospitals = await dbClient`
            SELECT h.hospital_id, h.hospital_name, COUNT(*) as count
            FROM redblood_inventory rb
            JOIN hospital h ON rb.hospital_id = h.hospital_id
            WHERE rb.hospital_id != ${hospitalId}
              AND rb.blood_type = ${blood_type}
              AND rb.rh = ${rh}
              AND rb.expiration_date > CURRENT_DATE
            GROUP BY h.hospital_id, h.hospital_name
            HAVING COUNT(*) > 10
            ORDER BY count DESC
          `
        } else if (type === "Plasma") {
          // Use tagged template literal syntax
          surplusHospitals = await dbClient`
            SELECT h.hospital_id, h.hospital_name, COUNT(*) as count
            FROM plasma_inventory p
            JOIN hospital h ON p.hospital_id = h.hospital_id
            WHERE p.hospital_id != ${hospitalId}
              AND p.blood_type = ${blood_type}
              AND p.expiration_date > CURRENT_DATE
            GROUP BY h.hospital_id, h.hospital_name
            HAVING COUNT(*) > 10
            ORDER BY count DESC
          `
        } else if (type === "Platelets") {
          // Use tagged template literal syntax
          surplusHospitals = await dbClient`
            SELECT h.hospital_id, h.hospital_name, COUNT(*) as count
            FROM platelets_inventory p
            JOIN hospital h ON p.hospital_id = h.hospital_id
            WHERE p.hospital_id != ${hospitalId}
              AND p.blood_type = ${blood_type}
              AND p.rh = ${rh}
              AND p.expiration_date > CURRENT_DATE
            GROUP BY h.hospital_id, h.hospital_name
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

// Helper function to search for donors
export async function searchDonors(query: string) {
  if (!query || query.trim() === "") return []

  try {
    const searchTerm = `%${query}%`

    // Search by bag ID if the query is a number
    if (!isNaN(Number(query))) {
      const bagId = Number(query)

      // Use tagged template literal syntax
      const redBloodResults = await dbClient`
        SELECT 'RedBlood' as type, rb.bag_id, rb.donor_name, rb.blood_type, rb.rh, 
               rb.amount, rb.expiration_date, h.hospital_name, h.hospital_contact_phone
        FROM redblood_inventory rb
        JOIN hospital h ON rb.hospital_id = h.hospital_id
        WHERE rb.bag_id = ${bagId}
      `

      // Use tagged template literal syntax
      const plasmaResults = await dbClient`
        SELECT 'Plasma' as type, p.bag_id, p.donor_name, p.blood_type, '' as rh, 
               p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
        FROM plasma_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.bag_id = ${bagId}
      `

      // Use tagged template literal syntax
      const plateletsResults = await dbClient`
        SELECT 'Platelets' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
               p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
        FROM platelets_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.bag_id = ${bagId}
      `

      return [...redBloodResults, ...plasmaResults, ...plateletsResults]
    }

    // Search by donor name
    // Use tagged template literal syntax
    const redBloodResults = await dbClient`
      SELECT 'RedBlood' as type, rb.bag_id, rb.donor_name, rb.blood_type, rb.rh, 
             rb.amount, rb.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM redblood_inventory rb
      JOIN hospital h ON rb.hospital_id = h.hospital_id
      WHERE rb.donor_name ILIKE ${searchTerm}
    `

    // Use tagged template literal syntax
    const plasmaResults = await dbClient`
      SELECT 'Plasma' as type, p.bag_id, p.donor_name, p.blood_type, '' as rh, 
             p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM plasma_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.donor_name ILIKE ${searchTerm}
    `

    // Use tagged template literal syntax
    const plateletsResults = await dbClient`
      SELECT 'Platelets' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
             p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM platelets_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.donor_name ILIKE ${searchTerm}
    `

    return [...redBloodResults, ...plasmaResults, ...plateletsResults]
  } catch (error) {
    throw logError(error, "Search Donors")
  }
}

// Helper function to add new plasma bag
export async function addNewPlasmaBag(
  donorName: string,
  amount: number,
  hospitalId: number,
  expirationDate: string,
  bloodType: string,
  adminUsername: string,
  adminPassword: string,
) {
  try {
    // Use tagged template literal syntax
    await dbClient`
      SELECT Add_New_PlasmaBag(
        ${donorName},
        ${amount},
        ${hospitalId},
        ${expirationDate}::date,
        ${bloodType},
        ${adminUsername},
        ${adminPassword}
      )
    `
    // Invalidate relevant caches
    queryCache.invalidate(`plasma:${hospitalId}`)
    return { success: true }
  } catch (error) {
    throw logError(error, "Add Plasma Bag")
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
    // Use tagged template literal syntax
    await dbClient`
      SELECT Add_New_PlateletsBag(
        ${donorName},
        ${amount},
        ${hospitalId},
        ${expirationDate}::date,
        ${bloodType},
        ${rh},
        ${adminUsername},
        ${adminPassword}
      )
    `
    // Invalidate relevant caches
    queryCache.invalidate(`platelets:${hospitalId}`)
    return { success: true }
  } catch (error) {
    throw logError(error, "Add Platelets Bag")
  }
}

// Helper function to add new red blood cell bag
export async function addNewRedBloodBag(
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
    // Use tagged template literal syntax
    await dbClient`
      SELECT Add_New_RedBloodBag(
        ${donorName},
        ${amount},
        ${hospitalId},
        ${expirationDate}::date,
        ${bloodType},
        ${rh},
        ${adminUsername},
        ${adminPassword}
      )
    `
    // Invalidate relevant caches
    queryCache.invalidate(`redblood:${hospitalId}`)
    return { success: true }
  } catch (error) {
    throw logError(error, "Add Red Blood Cell Bag")
  }
}

// Function to check database connection
export async function checkDatabaseConnection() {
  if (IS_FALLBACK_MODE) {
    return false
  }

  try {
    // Use tagged template literal syntax
    await dbClient`SELECT 1`
    return true
  } catch (error) {
    console.error("Database connection check failed:", error)
    IS_FALLBACK_MODE = true
    return false
  }
}

// Function to get fallback mode status
export function isFallbackMode() {
  return IS_FALLBACK_MODE
}

// Add this function to the existing db.ts file
export async function registerAdmin(username: string, password: string, hospitalId: number) {
  // Check if we're in fallback mode
  if (IS_FALLBACK_MODE) {
    // In fallback mode, simulate registration
    const existingAdmin = FALLBACK_DATA.admins.find((a) => a.admin_username === username)
    if (existingAdmin) {
      return { success: false, error: "Username already exists" }
    }

    // Add to fallback data (this won't persist across server restarts)
    const newAdminId = FALLBACK_DATA.admins.length + 1
    FALLBACK_DATA.admins.push({
      admin_id: newAdminId,
      admin_username: username,
      admin_password: password,
      hospital_id: hospitalId,
    })

    return { success: true }
  }

  try {
    // First check if the hospital exists
    // Use tagged template literal syntax
    const hospitalCheck = await dbClient`
      SELECT hospital_id FROM hospital WHERE hospital_id = ${hospitalId}
    `

    if (hospitalCheck.length === 0) {
      throw new AppError(ErrorType.VALIDATION, "Hospital not found")
    }

    // Check if username already exists
    // Use tagged template literal syntax
    const usernameCheck = await dbClient`
      SELECT admin_id FROM admin WHERE admin_username = ${username}
    `

    if (usernameCheck.length > 0) {
      throw new AppError(ErrorType.VALIDATION, "Username already exists")
    }

    // Insert new admin
    // Use tagged template literal syntax
    const result = await dbClient`
      INSERT INTO admin (admin_username, admin_password, hospital_id)
      VALUES (${username}, ${password}, ${hospitalId})
      RETURNING admin_id
    `

    if (result.length > 0) {
      return { success: true }
    } else {
      throw new AppError(ErrorType.SERVER, "Failed to create admin account")
    }
  } catch (error) {
    throw logError(error, "Register Admin")
  }
}

// Function to get connection error message
export function getConnectionErrorMessage() {
  return CONNECTION_ERROR_MESSAGE
}

// Function to get all hospitals for dropdown lists
export async function getAllHospitals() {
  try {
    const cacheKey = "all-hospitals"
    const cached = queryCache.get(cacheKey)

    if (cached) {
      return cached
    }

    // Use tagged template literal syntax
    const hospitals = await dbClient`
      SELECT hospital_id, hospital_name 
      FROM hospital 
      ORDER BY hospital_name
    `

    queryCache.set(cacheKey, hospitals)
    return hospitals
  } catch (error) {
    throw logError(error, "Get All Hospitals")
  }
}
