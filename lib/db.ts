import { neon } from "@neondatabase/serverless"
import { queryCache } from "./cache"
import { AppError, ErrorType, logError } from "./error-handling"
import { configureNeon, DB_CONFIG, getDatabaseUrl } from "./db-config"

// Configure Neon with optimal settings
configureNeon()

// Track connection errors for reporting
let CONNECTION_ERROR_MESSAGE = ""

// Function to get connection error message
export function getConnectionErrorMessage() {
  return CONNECTION_ERROR_MESSAGE
}

// Function to set connection error message
export function setConnectionErrorMessage(message: string) {
  CONNECTION_ERROR_MESSAGE = message
}

// Create SQL client with the database URL
const dbUrl = getDatabaseUrl()
export const dbClient = dbUrl ? neon(dbUrl) : null

// Mock data for build-time and fallback
const MOCK_DATA = {
  redblood: [],
  plasma: [],
  platelets: [],
  hospitals: [{ hospital_id: 1, hospital_name: "Demo Hospital" }],
}

// Execute a database query with timeout and fallback
export async function executeQuery(query: string, params: any[] = [], options: { useMockOnError?: boolean } = {}) {
  if (!dbClient) {
    if (process.env.NODE_ENV === "production") {
      console.warn("Database client not initialized, using mock data")
      return []
    }

    throw new AppError(
      ErrorType.DATABASE_CONNECTION,
      "Database client not initialized",
      "Database URL environment variable may be missing or invalid",
    )
  }

  try {
    // Add timeout to prevent hanging connections
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new AppError(ErrorType.TIMEOUT, "Database query timed out", "Query execution exceeded timeout limit"))
      }, DB_CONFIG.MAX_CONNECTION_TIME_MS)
    })

    // Execute the query with timeout
    const queryPromise = dbClient.query(query, params)
    const result = (await Promise.race([queryPromise, timeoutPromise])) as any[]

    return result
  } catch (error) {
    const appError = logError(error, "Execute Query")

    // Use mock data in production if specified
    if (options.useMockOnError && process.env.NODE_ENV === "production") {
      console.warn("Database query failed, using mock data:", appError.message)
      return []
    }

    throw appError
  }
}

// Function to test database connection
export async function testDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    // Check if database URL is defined
    const dbUrl = getDatabaseUrl()
    if (!dbUrl) {
      setConnectionErrorMessage("Database connection string is missing")
      return {
        connected: false,
        error: "Database connection string is missing",
      }
    }

    // Create a direct neon client for testing only
    const testClient = neon(dbUrl)

    // Use a timeout promise to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Database connection timed out"))
      }, DB_CONFIG.CONNECTION_TIMEOUT_MS)
    })

    try {
      // Race the database query against the timeout
      await Promise.race([testClient`SELECT 1 as connection_test`, timeoutPromise])
      setConnectionErrorMessage("") // Clear any previous error message
      return { connected: true }
    } catch (fetchError) {
      // Handle fetch errors specifically
      const errorMessage =
        fetchError instanceof Error
          ? `Database connection error: ${fetchError.message}`
          : "Failed to connect to database"

      setConnectionErrorMessage(errorMessage)
      console.error("Database connection test failed:", fetchError)

      return {
        connected: false,
        error: errorMessage,
      }
    }
  } catch (error) {
    // Handle any other errors
    const errorMessage = error instanceof Error ? error.message : "Unknown database connection error"

    setConnectionErrorMessage(errorMessage)
    console.error("Database connection test error:", error)

    return {
      connected: false,
      error: errorMessage,
    }
  }
}

// Initialize database connection on module load
if (
  process.env.NODE_ENV !== "production" ||
  (process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview" && process.env.NEXT_PUBLIC_VERCEL_ENV !== "development")
) {
  testDatabaseConnection()
    .then(({ connected, error }) => {
      if (!connected) {
        console.warn(`Database connection failed: ${error}. Application will show error messages to users.`)
        setConnectionErrorMessage(error || "Failed to connect to database")
      } else {
        console.log("Database connection successful")
        setConnectionErrorMessage("")
      }
    })
    .catch((error) => {
      console.error("Unexpected error during database initialization:", error)
      setConnectionErrorMessage(error instanceof Error ? error.message : String(error))
    })
}

// Helper function to get hospital data by ID
export async function getHospitalById(hospitalId: number) {
  try {
    const cacheKey = `hospital:${hospitalId}`
    const cached = queryCache.get(cacheKey)

    if (cached) {
      return cached
    }

    const result = await executeQuery("SELECT * FROM hospital WHERE hospital_id = $1", [hospitalId], {
      useMockOnError: true,
    })

    if (!result || result.length === 0) {
      if (process.env.NODE_ENV === "production") {
        // Return mock data in production
        return MOCK_DATA.hospitals[0]
      }
      throw new AppError(ErrorType.NOT_FOUND, "Hospital not found")
    }

    queryCache.set(cacheKey, result[0])
    return result[0]
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      // Return mock data in production
      console.warn("Error getting hospital data, using mock data:", error)
      return MOCK_DATA.hospitals[0]
    }
    throw logError(error, "Get Hospital")
  }
}

// Helper function to verify admin credentials
export async function verifyAdminCredentials(username: string, password: string) {
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

// Helper function to get blood inventory for a hospital
export async function getBloodInventory(hospitalId: number) {
  try {
    const cacheKey = `redblood:${hospitalId}`
    const cached = queryCache.get<any[]>(cacheKey)

    if (cached) {
      console.log("Using cached red blood cell data:", cached)
      return cached
    }

    const redBlood = await dbClient`
      SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM redblood_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
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

    const plasma = await dbClient`
      SELECT blood_type, COUNT(*) as count, SUM(amount) as total_amount
      FROM plasma_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
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

    const platelets = await dbClient`
      SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM platelets_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
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

// Helper function to search for donors
export async function searchDonors(query: string) {
  if (!query || query.trim() === "") return []

  try {
    const searchTerm = `%${query}%`

    // Search by bag ID if the query is a number
    if (!isNaN(Number(query))) {
      const bagId = Number(query)

      const redBloodResults = await dbClient`
        SELECT 'RedBlood' as type, rb.bag_id, rb.donor_name, rb.blood_type, rb.rh, 
               rb.amount, rb.expiration_date, h.hospital_name, h.hospital_contact_phone
        FROM redblood_inventory rb
        JOIN hospital h ON rb.hospital_id = h.hospital_id
        WHERE rb.bag_id = ${bagId} AND rb.active = true
      `

      const plasmaResults = await dbClient`
        SELECT 'Plasma' as type, p.bag_id, p.donor_name, p.blood_type, '' as rh, 
               p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
        FROM plasma_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.bag_id = ${bagId} AND p.active = true
      `

      const plateletsResults = await dbClient`
        SELECT 'Platelets' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
               p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
        FROM platelets_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.bag_id = ${bagId} AND p.active = true
      `

      return [...redBloodResults, ...plasmaResults, ...plateletsResults]
    }

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
    // Validate admin credentials
    const adminCheck = await verifyAdminCredentials(adminUsername, adminPassword)
    if (!adminCheck) {
      return {
        success: false,
        error: "Authentication failed",
        type: ErrorType.AUTHENTICATION,
        details: "Your session has expired or is invalid. Please log in again.",
      }
    }

    // Check if the admin belongs to the specified hospital
    if (adminCheck.hospital_id !== hospitalId) {
      return {
        success: false,
        error: "Unauthorized hospital access",
        type: ErrorType.AUTHENTICATION,
        details: "You don't have permission to add entries for this hospital.",
      }
    }

    try {
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

      // Invalidate relevant caches
      queryCache.invalidate(`plasma:${hospitalId}`)
      return { success: true }
    } catch (dbError: any) {
      // Handle specific database errors
      if (dbError.message?.includes("duplicate key")) {
        return {
          success: false,
          error: "Duplicate entry",
          type: ErrorType.VALIDATION,
          details: "A plasma bag with this information already exists.",
        }
      } else if (dbError.message?.includes("violates foreign key constraint")) {
        return {
          success: false,
          error: "Invalid reference",
          type: ErrorType.VALIDATION,
          details: "One of the referenced values (like hospital ID) is invalid.",
        }
      } else if (dbError.message?.includes("out of range")) {
        return {
          success: false,
          error: "Value out of range",
          type: ErrorType.VALIDATION,
          details: "One of the provided values is out of the acceptable range.",
        }
      }

      // For other database errors
      throw dbError
    }
  } catch (error) {
    // Convert to AppError and log
    const appError = logError(error, "Add Plasma Bag")

    // Return appropriate error response
    return {
      success: false,
      error: appError.message || "Failed to add plasma bag",
      type: appError.type,
      details: appError.details || "An unexpected error occurred while processing your request.",
    }
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
    // Validate admin credentials
    const adminCheck = await verifyAdminCredentials(adminUsername, adminPassword)
    if (!adminCheck) {
      return {
        success: false,
        error: "Authentication failed",
        type: ErrorType.AUTHENTICATION,
        details: "Your session has expired or is invalid. Please log in again.",
      }
    }

    // Check if the admin belongs to the specified hospital
    if (adminCheck.hospital_id !== hospitalId) {
      return {
        success: false,
        error: "Unauthorized hospital access",
        type: ErrorType.AUTHENTICATION,
        details: "You don't have permission to add entries for this hospital.",
      }
    }

    try {
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

      // Invalidate relevant caches
      queryCache.invalidate(`platelets:${hospitalId}`)
      return { success: true }
    } catch (dbError: any) {
      // Handle specific database errors
      if (dbError.message?.includes("duplicate key")) {
        return {
          success: false,
          error: "Duplicate entry",
          type: ErrorType.VALIDATION,
          details: "A platelets bag with this information already exists.",
        }
      } else if (dbError.message?.includes("violates foreign key constraint")) {
        return {
          success: false,
          error: "Invalid reference",
          type: ErrorType.VALIDATION,
          details: "One of the referenced values (like hospital ID) is invalid.",
        }
      } else if (dbError.message?.includes("out of range")) {
        return {
          success: false,
          error: "Value out of range",
          type: ErrorType.VALIDATION,
          details: "One of the provided values is out of the acceptable range.",
        }
      }

      // For other database errors
      throw dbError
    }
  } catch (error) {
    // Convert to AppError and log
    const appError = logError(error, "Add Platelets Bag")

    // Return appropriate error response
    return {
      success: false,
      error: appError.message || "Failed to add platelets bag",
      type: appError.type,
      details: appError.details || "An unexpected error occurred while processing your request.",
    }
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
    // Validate admin credentials
    const adminCheck = await verifyAdminCredentials(adminUsername, adminPassword)
    if (!adminCheck) {
      return {
        success: false,
        error: "Authentication failed",
        type: ErrorType.AUTHENTICATION,
        details: "Your session has expired or is invalid. Please log in again.",
      }
    }

    // Check if the admin belongs to the specified hospital
    if (adminCheck.hospital_id !== hospitalId) {
      return {
        success: false,
        error: "Unauthorized hospital access",
        type: ErrorType.AUTHENTICATION,
        details: "You don't have permission to add entries for this hospital.",
      }
    }

    try {
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

      // Invalidate relevant caches
      queryCache.invalidate(`redblood:${hospitalId}`)
      return { success: true }
    } catch (dbError: any) {
      // Handle specific database errors
      if (dbError.message?.includes("duplicate key")) {
        return {
          success: false,
          error: "Duplicate entry",
          type: ErrorType.VALIDATION,
          details: "A blood bag with this information already exists.",
        }
      } else if (dbError.message?.includes("violates foreign key constraint")) {
        return {
          success: false,
          error: "Invalid reference",
          type: ErrorType.VALIDATION,
          details: "One of the referenced values (like hospital ID) is invalid.",
        }
      } else if (dbError.message?.includes("out of range")) {
        return {
          success: false,
          error: "Value out of range",
          type: ErrorType.VALIDATION,
          details: "One of the provided values is out of the acceptable range.",
        }
      }

      // For other database errors
      throw dbError
    }
  } catch (error) {
    // Convert to AppError and log
    const appError = logError(error, "Add Red Blood Cell Bag")

    // Return appropriate error response
    return {
      success: false,
      error: appError.message || "Failed to add red blood cell bag",
      type: appError.type,
      details: appError.details || "An unexpected error occurred while processing your request.",
    }
  }
}

// Add this function to the existing db.ts file
export async function registerAdmin(username: string, password: string, hospitalId: number) {
  try {
    // First check if the hospital exists
    const hospitalCheck = await dbClient`
      SELECT hospital_id FROM hospital WHERE hospital_id = ${hospitalId}
    `

    if (hospitalCheck.length === 0) {
      throw new AppError(ErrorType.VALIDATION, "Hospital not found")
    }

    // Check if username already exists
    const usernameCheck = await dbClient`
      SELECT admin_id FROM admin WHERE admin_username = ${username}
    `

    if (usernameCheck.length > 0) {
      throw new AppError(ErrorType.VALIDATION, "Username already exists")
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
      throw new AppError(ErrorType.SERVER, "Failed to create admin account")
    }
  } catch (error) {
    throw logError(error, "Register Admin")
  }
}

// Function to get all hospitals for dropdown lists
export async function getAllHospitals() {
  try {
    const cacheKey = "all-hospitals"
    const cached = queryCache.get(cacheKey)

    if (cached) {
      return cached
    }

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

// New function to soft-delete a blood inventory entry
export async function softDeleteBloodEntry(bagId: number, entryType: string, hospitalId: number) {
  try {
    // Verify that the entry belongs to the hospital
    const ownershipCheck = await verifyEntryOwnership(bagId, entryType, hospitalId)
    if (!ownershipCheck.success) {
      return ownershipCheck
    }

    // Soft-delete the entry based on its type by setting active = false
    let result
    if (entryType === "RedBlood") {
      result = await dbClient`
        UPDATE redblood_inventory
        SET active = false
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
      // Invalidate cache
      queryCache.invalidate(`redblood:${hospitalId}`)
    } else if (entryType === "Plasma") {
      result = await dbClient`
        UPDATE plasma_inventory
        SET active = false
        WHERE bag_id = ${bagId} AND hospital_id = ${hospitalId}
        RETURNING bag_id
      `
      // Invalidate cache
      queryCache.invalidate(`plasma:${hospitalId}`)
    } else if (entryType === "Platelets") {
      result = await dbClient`
        UPDATE platelets_inventory
        SET active = false
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
    console.error("Error soft-deleting blood entry:", error)
    const appError = logError(error, "Soft Delete Blood Entry")
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
        SELECT hospital_id FROM redblood_inventory WHERE bag_id = ${bagId} AND active = true
      `
    } else if (entryType === "Plasma") {
      result = await dbClient`
        SELECT hospital_id FROM plasma_inventory WHERE bag_id = ${bagId} AND active = true
      `
    } else if (entryType === "Platelets") {
      result = await dbClient`
        SELECT hospital_id FROM platelets_inventory WHERE bag_id = ${bagId} AND active = true
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

// Export for testing
export { testDatabaseConnection as testDatabaseConnectionWithoutCache }
