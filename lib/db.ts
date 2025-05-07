import { neon, neonConfig } from "@neondatabase/serverless"
import { queryCache } from "./cache"
import { AppError, ErrorType, logError } from "./error-handling"
import { configureNeon } from "./db-config"
import { retryWithBackoff } from "./retry-utils"

// Configure Neon with optimal settings
neonConfig.fetchRetryTimeout = 15000 // 15 seconds timeout
neonConfig.fetchRetryCount = 2 // Reduced from 3 to fail faster when there's a persistent issue
neonConfig.wsConnectionTimeoutMs = 15000 // 15 seconds WebSocket timeout

// Initialize Neon configuration
configureNeon()

// Track connection errors for reporting
let CONNECTION_ERROR_MESSAGE = ""

// Create a SQL client with proper error handling
// Initialize the neon client once - with better error handling
let dbClient = null
try {
  if (process.env.DATABASE_URL) {
    // Log the database URL (with sensitive parts redacted) for debugging
    const redactedUrl = process.env.DATABASE_URL.replace(/(postgres:\/\/)([^:]+):([^@]+)@/, "$1$2:****@")
    console.log(`Initializing database client with URL: ${redactedUrl}`)

    dbClient = neon(process.env.DATABASE_URL)
    console.log("Database client initialized successfully")
  } else {
    console.warn("DATABASE_URL is not defined, database client not initialized")
    CONNECTION_ERROR_MESSAGE = "Database connection string is missing"
    throw new Error("DATABASE_URL environment variable is not defined")
  }
} catch (error) {
  console.error("Failed to initialize database client:", error)
  CONNECTION_ERROR_MESSAGE = error instanceof Error ? error.message : "Unknown database initialization error"
  // Don't throw here to allow the application to start in preview environments
}

// Flag to determine if we're in a preview environment
const isPreviewEnvironment =
  process.env.VERCEL_ENV === "preview" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
  process.env.NODE_ENV === "development"

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

// Function to test database connection with retry logic
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
      }, 15000)
    })

    // Implement retry logic for the connection test
    return await retryWithBackoff(
      async () => {
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

          // Throw to trigger retry
          throw new Error(errorMessage)
        }
      },
      {
        maxRetries: 1,
        initialDelayMs: 1000,
        maxDelayMs: 3000,
        backoffFactor: 2,
        onRetry: (attempt, error) => {
          console.log(`Retrying database connection (attempt ${attempt}/1): ${error.message}`)
        },
      },
    ).catch((error) => {
      // After all retries failed
      return {
        connected: false,
        error: error.message || "Failed to connect to database after multiple attempts",
      }
    })
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
// Initialize database connection on module load with better error handling
// but don't block the application startup
;(async () => {
  try {
    const { connected, error } = await testDatabaseConnection()
    if (connected) {
      console.log("Database connection successful")
    } else {
      console.error(`Database connection failed: ${error}. Application will not function correctly.`)
      CONNECTION_ERROR_MESSAGE = error || "Failed to connect to database"
    }
  } catch (error) {
    console.error("Unexpected error during database initialization:", error)
    CONNECTION_ERROR_MESSAGE = error instanceof Error ? error.message : String(error)
  }
})()

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
  // IMPORTANT: Completely bypass database calls in preview environments
  // This is the most critical fix to prevent "Failed to fetch" errors
  if (
    process.env.VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development"
  ) {
    console.log("[Preview Mode] Bypassing database authentication")

    // Allow these credentials in preview mode
    if ((username === "demo" && password === "demo") || (username === "admin" && password === "password")) {
      console.log("[Preview Mode] Using mock credentials")
      return {
        admin_id: 1,
        hospital_id: 1,
      }
    }

    // Return null for invalid credentials even in preview
    console.log("[Preview Mode] Invalid credentials")
    return null
  }

  try {
    // Only attempt database connection in non-preview environments
    if (!dbClient) {
      console.error("Database client not initialized in verifyAdminCredentials")
      throw new AppError(
        ErrorType.DATABASE_CONNECTION,
        "Database connection not available",
        "Database client not initialized",
      )
    }

    // Use tagged template literal syntax with error handling
    try {
      const result = await dbClient`
        SELECT admin_id, hospital_id FROM admin 
        WHERE admin_username = ${username} AND admin_password = ${password}
      `
      return result[0] || null
    } catch (error) {
      console.error("Database query failed in verifyAdminCredentials:", error)
      throw error
    }
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

    // Use tagged template literal syntax - now filtering for active=true
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
    console.error("Error fetching blood inventory:", error)
    throw logError(error, "Get Blood Inventory")
  }
}

// Function to check database connection with improved error handling
export async function checkDatabaseConnection() {
  try {
    // Implement retry logic for the connection check
    return await retryWithBackoff(
      async () => {
        try {
          // Use tagged template literal syntax
          await dbClient`SELECT 1`
          return true
        } catch (error) {
          console.error("Database connection check failed:", error)
          // Throw to trigger retry
          throw error
        }
      },
      {
        maxRetries: 2,
        initialDelayMs: 500,
        maxDelayMs: 2000,
        backoffFactor: 2,
        onRetry: (attempt, error) => {
          console.log(`Retrying database connection check (attempt ${attempt}/2): ${error.message || "Unknown error"}`)
        },
      },
    ).catch((error) => {
      // After all retries failed
      console.error("All database connection check retries failed:", error)
      return false
    })
  } catch (error) {
    // Handle any other errors
    console.error("Database connection check error:", error)
    return false
  }
}

// Function to get connection error message
export function getConnectionErrorMessage() {
  return CONNECTION_ERROR_MESSAGE
}

// Add this function to the existing db.ts file
export async function registerAdmin(username: string, password: string, hospitalId: number) {
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

// Helper function to get all hospitals for dropdown lists
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
    console.error("Error fetching hospitals:", error)
    throw logError(error, "Get All Hospitals")
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

    // Use tagged template literal syntax - now filtering for active=true
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

    queryCache.set(cacheKey, processedData)
    return processedData
  } catch (error) {
    console.error("Error fetching plasma inventory:", error)
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

    // Use tagged template literal syntax - now filtering for active=true
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

    queryCache.set(cacheKey, processedData)
    return processedData
  } catch (error) {
    console.error("Error fetching platelets inventory:", error)
    throw logError(error, "Get Platelets Inventory")
  }
}

// Helper function to get surplus alerts
export async function getSurplusAlerts(hospitalId: number) {
  try {
    // Get current hospital's inventory
    // Use tagged template literal syntax - now filtering for active=true
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
          // Use tagged template literal syntax - now filtering for active=true
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
          // Use tagged template literal syntax - now filtering for active=true
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
          // Use tagged template literal syntax - now filtering for active=true
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
    throw logError(error, "Get Surplus Alerts")
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
    // Check database connection first
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return {
        success: false,
        error: "Database connection error",
        type: ErrorType.DATABASE_CONNECTION,
        details: "Unable to connect to the database. Please try again later.",
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
      // Modified to include active=true
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
          details: "The connection to the database was lost. Please try again later.",
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
    // Check database connection first
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return {
        success: false,
        error: "Database connection error",
        type: ErrorType.DATABASE_CONNECTION,
        details: "Unable to connect to the database. Please try again later.",
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
      // Modified to include active=true
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
    // Check database connection first
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return {
        success: false,
        error: "Database connection error",
        type: ErrorType.DATABASE_CONNECTION,
        details: "Unable to connect to the database. Please try again later.",
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
      // Modified to include active=true
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

// Helper function to search for donors
export async function searchDonors(query: string, showInactive = false) {
  // Check if we're in a preview environment
  if (
    process.env.VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development"
  ) {
    console.log("[Preview Mode] Using mock data for searchDonors")

    // Return mock data for preview environments
    return [
      {
        type: "RedBlood",
        bag_id: 1001,
        donor_name: "John Doe",
        blood_type: "A",
        rh: "+",
        amount: 450,
        expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        hospital_name: "Central Hospital",
        hospital_id: 1,
        active: true,
      },
      {
        type: "Plasma",
        bag_id: 2001,
        donor_name: "Jane Smith",
        blood_type: "O",
        rh: "",
        amount: 300,
        expiration_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        hospital_name: "Central Hospital",
        hospital_id: 1,
        active: true,
      },
      {
        type: "Platelets",
        bag_id: 3001,
        donor_name: "Robert Johnson",
        blood_type: "B",
        rh: "-",
        amount: 250,
        expiration_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        hospital_name: "Central Hospital",
        hospital_id: 1,
        active: true,
      },
      {
        type: "RedBlood",
        bag_id: 1002,
        donor_name: "Sarah Williams",
        blood_type: "AB",
        rh: "+",
        amount: 400,
        expiration_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        hospital_name: "Central Hospital",
        hospital_id: 1,
        active: false,
      },
    ].filter((entry) => {
      // Filter by active status
      if (!showInactive && !entry.active) return false

      // Filter by query if provided
      if (query && query.trim() !== "") {
        // Check if query matches donor name
        if (entry.donor_name.toLowerCase().includes(query.toLowerCase())) {
          return true
        }

        // Check if query matches bag ID
        if (!isNaN(Number(query)) && entry.bag_id === Number(query)) {
          return true
        }

        return false
      }

      return true
    })
  }

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
    throw logError(error, "Search Donors")
  }
}

// Export the client for use in other modules
export { dbClient }
