import { neon, neonConfig } from "@neondatabase/serverless"
import { queryCache } from "./cache"
import { AppError, ErrorType, logError } from "./error-handling"
import { retryWithBackoff } from "./retry-utils"

// Configure Neon with optimal settings for real-time data
neonConfig.fetchRetryTimeout = 15000 // 15 seconds timeout
neonConfig.fetchRetryCount = 3 // Retry 3 times
neonConfig.wsConnectionTimeoutMs = 15000 // 15 seconds WebSocket timeout

// Track connection errors for reporting
let CONNECTION_ERROR_MESSAGE = ""

// Initialize the database client
let dbClient = null
try {
  if (process.env.DATABASE_URL) {
    // Log the database URL (with sensitive parts redacted) for debugging
    const redactedUrl = process.env.DATABASE_URL.replace(/(postgres:\/\/)([^:]+):([^@]+)@/, "$1$2:****@")
    console.log(`Initializing database client with URL: ${redactedUrl}`)

    dbClient = neon(process.env.DATABASE_URL)
    console.log("Database client initialized successfully")
  } else {
    console.error("DATABASE_URL is not defined, database client not initialized")
    CONNECTION_ERROR_MESSAGE = "Database connection string is missing"
    throw new Error("Database connection string is missing")
  }
} catch (error) {
  console.error("Failed to initialize database client:", error)
  CONNECTION_ERROR_MESSAGE = error instanceof Error ? error.message : "Unknown database initialization error"
  throw new Error("Failed to initialize database connection")
}

/**
 * Execute SQL query with proper error handling and retries
 */
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
      }, 15000)
    })

    // Use retry mechanism for database queries
    return await retryWithBackoff(
      async () => {
        try {
          // Race the database query against the timeout
          return (await Promise.race([dbClient.query(query, args), timeoutPromise])) as any[]
        } catch (fetchError) {
          console.error("Database query error:", fetchError)
          CONNECTION_ERROR_MESSAGE =
            fetchError instanceof Error
              ? `Error connecting to database: ${fetchError.message}`
              : "Database query failed"
          throw new AppError(
            ErrorType.DATABASE_CONNECTION,
            "Database query failed",
            fetchError instanceof Error ? fetchError.message : String(fetchError),
          )
        }
      },
      {
        maxRetries: 2,
        initialDelay: 500,
        maxDelay: 2000,
        factor: 2,
        onRetry: (attempt, error) => {
          console.log(`Retrying database query (attempt ${attempt}/2): ${error.message || "Unknown error"}`)
        },
      },
    )
  } catch (error) {
    // Convert and log the error
    CONNECTION_ERROR_MESSAGE = error instanceof Error ? `Database error: ${error.message}` : "Unknown database error"
    const appError = logError(error, "Database Query")

    // Rethrow the error to be handled by the caller
    throw appError
  }
}

/**
 * Test database connection with retry logic
 */
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
        CONNECTION_ERROR_MESSAGE = "Database connection timed out"
        reject(new Error("Database connection timed out"))
      }, 15000)
    })

    // Implement retry logic for the connection test
    return await retryWithBackoff(
      async () => {
        try {
          // Race the database query against the timeout
          await Promise.race([testClient`SELECT 1 as connection_test`, timeoutPromise])
          CONNECTION_ERROR_MESSAGE = "" // Clear error message on success
          return { connected: true }
        } catch (fetchError) {
          // Handle fetch errors specifically
          const errorMessage =
            fetchError instanceof Error
              ? `Database connection error: ${fetchError.message}`
              : "Failed to connect to database"

          CONNECTION_ERROR_MESSAGE = errorMessage
          console.error("Database connection test failed:", fetchError)

          // Throw to trigger retry
          throw new Error(errorMessage)
        }
      },
      {
        maxRetries: 2,
        initialDelay: 1000,
        maxDelay: 3000,
        factor: 2,
        onRetry: (attempt, error) => {
          console.log(`Retrying database connection (attempt ${attempt}/2): ${error.message}`)
        },
      },
    ).catch((error) => {
      // After all retries failed
      CONNECTION_ERROR_MESSAGE = error.message || "Failed to connect to database after multiple attempts"
      return {
        connected: false,
        error: error.message || "Failed to connect to database after multiple attempts",
      }
    })
  } catch (error) {
    // Handle any other errors
    const errorMessage = error instanceof Error ? error.message : "Unknown database connection error"
    console.error("Database connection test error:", error)
    CONNECTION_ERROR_MESSAGE = errorMessage

    return {
      connected: false,
      error: errorMessage,
    }
  }
}

/**
 * Get hospital data by ID
 */
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

    queryCache.set(cacheKey, result[0], 300) // Cache for 5 minutes
    return result[0]
  } catch (error) {
    throw logError(error, "Get Hospital")
  }
}

/**
 * Verify admin credentials
 */
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

/**
 * Get blood inventory for a hospital
 */
export async function getBloodInventory(hospitalId: number) {
  try {
    const cacheKey = `redblood:${hospitalId}`
    const cached = queryCache.get<any[]>(cacheKey)

    if (cached) {
      console.log("Using cached red blood cell data")
      return cached
    }

    // Use tagged template literal syntax - filtering for active=true
    const redBlood = await dbClient`
      SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM redblood_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh
    `

    console.log("Retrieved red blood cell data from DB")

    // Ensure numeric values are properly parsed
    const processedData = redBlood.map((item) => ({
      ...item,
      count: Number(item.count),
      total_amount: Number(item.total_amount),
    }))

    queryCache.set(cacheKey, processedData, 60) // Cache for 1 minute
    return processedData
  } catch (error) {
    console.error("Error fetching blood inventory:", error)
    throw new AppError(
      ErrorType.DATABASE_QUERY,
      "Failed to fetch blood inventory",
      error instanceof Error ? error.message : String(error),
    )
  }
}

/**
 * Add new red blood cell bag
 */
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
    // Check database connection first
    const connectionCheck = await testDatabaseConnection()
    if (!connectionCheck.connected) {
      return {
        success: false,
        error: "Database connection error",
        type: ErrorType.DATABASE_CONNECTION,
        details: connectionCheck.error || "Unable to connect to the database. Please try again later.",
        retryable: true,
      }
    }

    // Validate admin credentials
    const adminCheck = await verifyAdminCredentials(adminUsername, adminPassword)
    if (!adminCheck) {
      return {
        success: false,
        error: "Authentication failed",
        type: ErrorType.AUTHENTICATION,
        details: "Your session has expired or is invalid. Please log in again.",
        retryable: false,
      }
    }

    // Check if the admin belongs to the specified hospital
    if (adminCheck.hospital_id !== hospitalId) {
      return {
        success: false,
        error: "Unauthorized hospital access",
        type: ErrorType.AUTHENTICATION,
        details: "You don't have permission to add entries for this hospital.",
        retryable: false,
      }
    }

    // Use tagged template literal syntax with error handling
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
          details: "A red blood cell bag with this information already exists.",
          retryable: false,
        }
      } else if (dbError.message?.includes("violates foreign key constraint")) {
        return {
          success: false,
          error: "Invalid reference",
          type: ErrorType.VALIDATION,
          details: "One of the referenced values (like hospital ID) is invalid.",
          retryable: false,
        }
      } else if (dbError.message?.includes("out of range")) {
        return {
          success: false,
          error: "Value out of range",
          type: ErrorType.VALIDATION,
          details: "One of the provided values is out of the acceptable range.",
          retryable: false,
        }
      } else if (dbError.message?.includes("connection")) {
        return {
          success: false,
          error: "Database connection lost",
          type: ErrorType.DATABASE_CONNECTION,
          details: "The connection to the database was lost. Please try again.",
          retryable: true,
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
      retryable: appError.type === ErrorType.DATABASE_CONNECTION || appError.type === ErrorType.SERVER,
    }
  }
}

/**
 * Add new plasma bag
 */
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
    // Check database connection first
    const connectionCheck = await testDatabaseConnection()
    if (!connectionCheck.connected) {
      return {
        success: false,
        error: "Database connection error",
        type: ErrorType.DATABASE_CONNECTION,
        details: connectionCheck.error || "Unable to connect to the database. Please try again later.",
        retryable: true,
      }
    }

    // Validate admin credentials
    const adminCheck = await verifyAdminCredentials(adminUsername, adminPassword)
    if (!adminCheck) {
      return {
        success: false,
        error: "Authentication failed",
        type: ErrorType.AUTHENTICATION,
        details: "Your session has expired or is invalid. Please log in again.",
        retryable: false,
      }
    }

    // Check if the admin belongs to the specified hospital
    if (adminCheck.hospital_id !== hospitalId) {
      return {
        success: false,
        error: "Unauthorized hospital access",
        type: ErrorType.AUTHENTICATION,
        details: "You don't have permission to add entries for this hospital.",
        retryable: false,
      }
    }

    // Use tagged template literal syntax with error handling
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
          retryable: false,
        }
      } else if (dbError.message?.includes("violates foreign key constraint")) {
        return {
          success: false,
          error: "Invalid reference",
          type: ErrorType.VALIDATION,
          details: "One of the referenced values (like hospital ID) is invalid.",
          retryable: false,
        }
      } else if (dbError.message?.includes("out of range")) {
        return {
          success: false,
          error: "Value out of range",
          type: ErrorType.VALIDATION,
          details: "One of the provided values is out of the acceptable range.",
          retryable: false,
        }
      } else if (dbError.message?.includes("connection")) {
        return {
          success: false,
          error: "Database connection lost",
          type: ErrorType.DATABASE_CONNECTION,
          details: "The connection to the database was lost. Please try again.",
          retryable: true,
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
      retryable: appError.type === ErrorType.DATABASE_CONNECTION || appError.type === ErrorType.SERVER,
    }
  }
}

/**
 * Add new platelets bag
 */
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
    // Check database connection first
    const connectionCheck = await testDatabaseConnection()
    if (!connectionCheck.connected) {
      return {
        success: false,
        error: "Database connection error",
        type: ErrorType.DATABASE_CONNECTION,
        details: connectionCheck.error || "Unable to connect to the database. Please try again later.",
        retryable: true,
      }
    }

    // Validate admin credentials
    const adminCheck = await verifyAdminCredentials(adminUsername, adminPassword)
    if (!adminCheck) {
      return {
        success: false,
        error: "Authentication failed",
        type: ErrorType.AUTHENTICATION,
        details: "Your session has expired or is invalid. Please log in again.",
        retryable: false,
      }
    }

    // Check if the admin belongs to the specified hospital
    if (adminCheck.hospital_id !== hospitalId) {
      return {
        success: false,
        error: "Unauthorized hospital access",
        type: ErrorType.AUTHENTICATION,
        details: "You don't have permission to add entries for this hospital.",
        retryable: false,
      }
    }

    // Use tagged template literal syntax with error handling
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
          retryable: false,
        }
      } else if (dbError.message?.includes("violates foreign key constraint")) {
        return {
          success: false,
          error: "Invalid reference",
          type: ErrorType.VALIDATION,
          details: "One of the referenced values (like hospital ID) is invalid.",
          retryable: false,
        }
      } else if (dbError.message?.includes("out of range")) {
        return {
          success: false,
          error: "Value out of range",
          type: ErrorType.VALIDATION,
          details: "One of the provided values is out of the acceptable range.",
          retryable: false,
        }
      } else if (dbError.message?.includes("connection")) {
        return {
          success: false,
          error: "Database connection lost",
          type: ErrorType.DATABASE_CONNECTION,
          details: "The connection to the database was lost. Please try again.",
          retryable: true,
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
      retryable: appError.type === ErrorType.DATABASE_CONNECTION || appError.type === ErrorType.SERVER,
    }
  }
}

/**
 * Get plasma inventory for a hospital
 */
export async function getPlasmaInventory(hospitalId: number) {
  try {
    const cacheKey = `plasma:${hospitalId}`
    const cached = queryCache.get<any[]>(cacheKey)

    if (cached) {
      return cached
    }

    // Use tagged template literal syntax - filtering for active=true
    const plasma = await dbClient`
      SELECT blood_type, COUNT(*) as count, SUM(amount) as total_amount
      FROM plasma_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
      GROUP BY blood_type
      ORDER BY blood_type
    `

    // Ensure numeric values are properly parsed
    const processedData = plasma.map((item) => ({
      ...item,
      count: Number(item.count),
      total_amount: Number(item.total_amount),
    }))

    queryCache.set(cacheKey, processedData, 60) // Cache for 1 minute
    return processedData
  } catch (error) {
    console.error("Error fetching plasma inventory:", error)
    throw new AppError(
      ErrorType.DATABASE_CONNECTION,
      "Failed to fetch plasma inventory",
      error instanceof Error ? error.message : String(error),
    )
  }
}

/**
 * Get platelets inventory for a hospital
 */
export async function getPlateletsInventory(hospitalId: number) {
  try {
    const cacheKey = `platelets:${hospitalId}`
    const cached = queryCache.get<any[]>(cacheKey)

    if (cached) {
      return cached
    }

    // Use tagged template literal syntax - filtering for active=true
    const platelets = await dbClient`
      SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM platelets_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
      GROUP BY blood_type, rh
      ORDER BY blood_type, rh
    `

    // Ensure numeric values are properly parsed
    const processedData = platelets.map((item) => ({
      ...item,
      count: Number(item.count),
      total_amount: Number(item.total_amount),
    }))

    queryCache.set(cacheKey, processedData, 60) // Cache for 1 minute
    return processedData
  } catch (error) {
    console.error("Error fetching platelets inventory:", error)
    throw new AppError(
      ErrorType.DATABASE_CONNECTION,
      "Failed to fetch platelets inventory",
      error instanceof Error ? error.message : String(error),
    )
  }
}

/**
 * Get all hospitals for dropdown lists
 */
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

    queryCache.set(cacheKey, hospitals, 300) // Cache for 5 minutes
    return hospitals
  } catch (error) {
    console.error("Error fetching hospitals:", error)
    throw new AppError(
      ErrorType.DATABASE_QUERY,
      "Failed to fetch hospitals",
      error instanceof Error ? error.message : String(error),
    )
  }
}

/**
 * Get surplus alerts
 */
export async function getSurplusAlerts(hospitalId: number) {
  try {
    // Get current hospital's inventory
    // Use tagged template literal syntax - filtering for active=true
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
          // Use tagged template literal syntax - filtering for active=true
          surplusHospitals = await dbClient`
            SELECT h.hospital_id, h.hospital_name, COUNT(*) as count
            FROM redblood_inventory rb
            JOIN hospital h ON rb.hospital_id = h.hospital_id
            WHERE rb.hospital_id != ${hospitalId}
              AND rb.blood_type = ${blood_type}
              AND rb.rh = ${rh}
              AND rb.expiration_date > CURRENT_DATE
              AND rb.active = true
            GROUP BY h.hospital_id, h.hospital_name
            HAVING COUNT(*) > 10
            ORDER BY count DESC
          `
        } else if (type === "Plasma") {
          // Use tagged template literal syntax - filtering for active=true
          surplusHospitals = await dbClient`
            SELECT h.hospital_id, h.hospital_name, COUNT(*) as count
            FROM plasma_inventory p
            JOIN hospital h ON p.hospital_id = h.hospital_id
            WHERE p.hospital_id != ${hospitalId}
              AND p.blood_type = ${blood_type}
              AND p.expiration_date > CURRENT_DATE
              AND p.active = true
            GROUP BY h.hospital_id, h.hospital_name
            HAVING COUNT(*) > 10
            ORDER BY count DESC
          `
        } else if (type === "Platelets") {
          // Use tagged template literal syntax - filtering for active=true
          surplusHospitals = await dbClient`
            SELECT h.hospital_id, h.hospital_name, COUNT(*) as count
            FROM platelets_inventory p
            JOIN hospital h ON p.hospital_id = h.hospital_id
            WHERE p.hospital_id != ${hospitalId}
              AND p.blood_type = ${blood_type}
              AND p.rh = ${rh}
              AND p.expiration_date > CURRENT_DATE
              AND p.active = true
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
    console.error("Error fetching surplus alerts:", error)
    throw new AppError(
      ErrorType.DATABASE_QUERY,
      "Failed to fetch surplus alerts",
      error instanceof Error ? error.message : String(error),
    )
  }
}

/**
 * Search for donors
 */
export async function searchDonors(query: string, showInactive = false) {
  if (!query || query.trim() === "") return []

  try {
    const searchTerm = `%${query}%`

    // Search by bag ID if the query is a number
    if (!isNaN(Number(query))) {
      const bagId = Number(query)

      // Use tagged template literal syntax
      const redBloodResults = await dbClient`
        SELECT 'RedBlood' as type, rb.bag_id, rb.donor_name, rb.blood_type, rb.rh, 
               rb.amount, rb.expiration_date, h.hospital_name, h.hospital_contact_phone,
               h.hospital_id, rb.active
        FROM redblood_inventory rb
        JOIN hospital h ON rb.hospital_id = h.hospital_id
        WHERE rb.bag_id = ${bagId} ${showInactive ? sql`` : sql`AND rb.active = true`}
      `

      // Use tagged template literal syntax
      const plasmaResults = await dbClient`
        SELECT 'Plasma' as type, p.bag_id, p.donor_name, p.blood_type, '' as rh, 
               p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone,
               h.hospital_id, p.active
        FROM plasma_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.bag_id = ${bagId} ${showInactive ? sql`` : sql`AND p.active = true`}
      `

      // Use tagged template literal syntax
      const plateletsResults = await dbClient`
        SELECT 'Platelets' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
               p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone,
               h.hospital_id, p.active
        FROM platelets_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.bag_id = ${bagId} ${showInactive ? sql`` : sql`AND p.active = true`}
      `

      return [...redBloodResults, ...plasmaResults, ...plateletsResults]
    }

    // Search by donor name
    // Use tagged template literal syntax
    const redBloodResults = await dbClient`
      SELECT 'RedBlood' as type, rb.bag_id, rb.donor_name, rb.blood_type, rb.rh, 
             rb.amount, rb.expiration_date, h.hospital_name, h.hospital_contact_phone,
             h.hospital_id, rb.active
      FROM redblood_inventory rb
      JOIN hospital h ON rb.hospital_id = h.hospital_id
      WHERE rb.donor_name ILIKE ${searchTerm} ${showInactive ? sql`` : sql`AND rb.active = true`}
    `

    // Use tagged template literal syntax
    const plasmaResults = await dbClient`
      SELECT 'Plasma' as type, p.bag_id, p.donor_name, p.blood_type, '' as rh, 
             p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone,
             h.hospital_id, p.active
      FROM plasma_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.donor_name ILIKE ${searchTerm} ${showInactive ? sql`` : sql`AND p.active = true`}
    `

    // Use tagged template literal syntax
    const plateletsResults = await dbClient`
      SELECT 'Platelets' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
             p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone,
             h.hospital_id, p.active
      FROM platelets_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.donor_name ILIKE ${searchTerm} ${showInactive ? sql`` : sql`AND p.active = true`}
    `

    return [...redBloodResults, ...plasmaResults, ...plateletsResults]
  } catch (error) {
    console.error("Error searching donors:", error)
    throw new AppError(
      ErrorType.DATABASE_QUERY,
      "Failed to search donors",
      error instanceof Error ? error.message : String(error),
    )
  }
}

/**
 * Soft-delete a blood inventory entry
 */
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

/**
 * Verify entry ownership
 */
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

/**
 * Register a new admin user
 * @param username Admin username
 * @param password Admin password
 * @param hospitalId Hospital ID
 * @returns Success status and error message if applicable
 */
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

/**
 * Get the current connection error message
 * @returns The current connection error message
 */
export function getConnectionErrorMessage() {
  return CONNECTION_ERROR_MESSAGE
}

// Export the client for use in other modules
export { dbClient }
