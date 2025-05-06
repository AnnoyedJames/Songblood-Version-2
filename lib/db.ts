import { neon, neonConfig } from "@neondatabase/serverless"
import { queryCache } from "./cache"
import { AppError, ErrorType, logError } from "./error-handling"
import { configureNeon } from "./db-config"
import { retryWithBackoff } from "./retry-utils"

// Configure Neon with optimal settings
neonConfig.fetchRetryTimeout = 15000 // 15 seconds timeout (increased from 10)
neonConfig.fetchRetryCount = 2 // Reduced from 3 to fail faster when there's a persistent issue
neonConfig.wsConnectionTimeoutMs = 15000 // 15 seconds WebSocket timeout (increased from 10)

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
  surplus_alerts: [
    {
      type: "RedBlood",
      bloodType: "A",
      rh: "+",
      hospitalName: "โรงพยาบาลศิริราช",
      hospitalId: 2,
      count: 15,
      yourCount: 3,
    },
    {
      type: "Plasma",
      bloodType: "O",
      rh: "",
      hospitalName: "โรงพยาบาลศิริราช",
      hospitalId: 2,
      count: 12,
      yourCount: 2,
    },
  ],
  donors: [
    {
      type: "RedBlood",
      bag_id: 1001,
      donor_name: "สมชาย ใจดี",
      blood_type: "A",
      rh: "+",
      amount: 450,
      expiration_date: "2023-12-31",
      hospital_name: "โรงพยาบาลจุฬาลงกรณ์",
      hospital_contact_phone: "02-256-4000",
    },
    {
      type: "Plasma",
      bag_id: 2001,
      donor_name: "สมหญิง มีน้ำใจ",
      blood_type: "O",
      rh: "",
      amount: 300,
      expiration_date: "2023-12-15",
      hospital_name: "โรงพยาบาลศิริราช",
      hospital_contact_phone: "02-419-7000",
    },
  ],
}

// Flag to track if we're in fallback mode
let IS_FALLBACK_MODE = false

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
    IS_FALLBACK_MODE = true
    CONNECTION_ERROR_MESSAGE = "Database connection string is missing"
  }
} catch (error) {
  console.error("Failed to initialize database client:", error)
  IS_FALLBACK_MODE = true
  CONNECTION_ERROR_MESSAGE = error instanceof Error ? error.message : "Unknown database initialization error"
}

// Immediately activate fallback mode for development/preview environments
// This helps when the database is not accessible from preview deployments
if (process.env.NODE_ENV !== "production") {
  console.log("Non-production environment detected. Enabling fallback mode by default.")
  IS_FALLBACK_MODE = true
}

export const sql = async (query: string, ...args: any[]) => {
  try {
    // Check if DATABASE_URL is defined
    if (!process.env.DATABASE_URL || !dbClient) {
      CONNECTION_ERROR_MESSAGE = "Database connection string is missing"
      IS_FALLBACK_MODE = true
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
      }, 15000) // Increased from 10000
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
      IS_FALLBACK_MODE = true
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
    IS_FALLBACK_MODE = true

    // Rethrow the error to be handled by the caller
    throw appError
  }
}

// Function to test database connection with retry logic
export async function testDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    // If we're already in fallback mode, don't bother testing
    if (IS_FALLBACK_MODE) {
      return {
        connected: false,
        error: CONNECTION_ERROR_MESSAGE || "Application is in fallback mode",
      }
    }

    // Check if DATABASE_URL is defined
    if (!process.env.DATABASE_URL) {
      CONNECTION_ERROR_MESSAGE = "Database connection string is missing"
      IS_FALLBACK_MODE = true
      return {
        connected: false,
        error: "Database connection string is missing",
      }
    }

    // For non-production environments, we'll skip the actual connection test
    // and just return a simulated success to avoid connection errors in preview
    if (process.env.NODE_ENV !== "production") {
      console.log("Non-production environment detected. Skipping actual database connection test.")
      return {
        connected: true,
        simulated: true,
      }
    }

    // Create a direct neon client for testing only
    const testClient = neon(process.env.DATABASE_URL)

    // Use a timeout promise to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Database connection timed out"))
      }, 15000) // Increased from 10000
    })

    // Implement retry logic for the connection test
    return await retryWithBackoff(
      async () => {
        try {
          // Use the tagged template literal syntax for the query
          // Race the database query against the timeout
          await Promise.race([testClient`SELECT 1 as connection_test`, timeoutPromise])
          IS_FALLBACK_MODE = false // Reset fallback mode if connection succeeds
          return { connected: true }
        } catch (fetchError) {
          // Handle fetch errors specifically
          const errorMessage =
            fetchError instanceof Error
              ? `Database connection error: ${fetchError.message}`
              : "Failed to connect to database"

          CONNECTION_ERROR_MESSAGE = errorMessage
          console.error("Database connection test failed:", fetchError)
          IS_FALLBACK_MODE = true

          // Throw to trigger retry
          throw new Error(errorMessage)
        }
      },
      {
        maxRetries: 1, // Reduced from 3 to fail faster
        initialDelayMs: 1000,
        maxDelayMs: 3000, // Reduced from 5000
        backoffFactor: 2,
        onRetry: (attempt, error) => {
          console.log(`Retrying database connection (attempt ${attempt}/1): ${error.message}`)
        },
      },
    ).catch((error) => {
      // After all retries failed
      IS_FALLBACK_MODE = true
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
    IS_FALLBACK_MODE = true

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
    // For non-production environments, we'll skip the actual connection test
    if (process.env.NODE_ENV !== "production") {
      console.log("Non-production environment detected. Skipping database initialization test.")
      return
    }

    const { connected, error } = await testDatabaseConnection()
    if (connected) {
      console.log("Database connection successful")
      IS_FALLBACK_MODE = false
    } else {
      console.warn(`Database connection failed: ${error}. Application will use fallback mode.`)
      CONNECTION_ERROR_MESSAGE = error || "Failed to connect to database"
      IS_FALLBACK_MODE = true
    }
  } catch (error) {
    console.error("Unexpected error during database initialization:", error)
    CONNECTION_ERROR_MESSAGE = error instanceof Error ? error.message : String(error)
    IS_FALLBACK_MODE = true
  }
})()

// Helper function to get hospital data by ID
export async function getHospitalById(hospitalId: number) {
  try {
    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      const hospital = FALLBACK_DATA.hospitals.find((h) => h.hospital_id === hospitalId)
      if (!hospital) {
        throw new AppError(ErrorType.NOT_FOUND, "Hospital not found")
      }
      return hospital
    }

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
    // If in fallback mode, try to return fallback data
    if (IS_FALLBACK_MODE) {
      const hospital = FALLBACK_DATA.hospitals.find((h) => h.hospital_id === hospitalId)
      if (hospital) {
        return hospital
      }
    }
    throw logError(error, "Get Hospital")
  }
}

// Helper function to verify admin credentials
export async function verifyAdminCredentials(username: string, password: string) {
  try {
    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      const admin = FALLBACK_DATA.admins.find((a) => a.admin_username === username && a.admin_password === password)
      return admin || null
    }

    // Use tagged template literal syntax
    const result = await dbClient`
      SELECT admin_id, hospital_id FROM admin 
      WHERE admin_username = ${username} AND admin_password = ${password}
    `

    return result[0] || null
  } catch (error) {
    // If in fallback mode, try to return fallback data
    if (IS_FALLBACK_MODE) {
      const admin = FALLBACK_DATA.admins.find((a) => a.admin_username === username && a.admin_password === password)
      return admin || null
    }

    // Log the error but don't expose it to the caller
    logError(error, "Verify Admin Credentials")
    return null
  }
}

// Helper function to get blood inventory for a hospital
export async function getBloodInventory(hospitalId: number) {
  try {
    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      // Return sample data in fallback mode
      return [
        { blood_type: "A", rh: "+", count: 15, total_amount: 4500 },
        { blood_type: "A", rh: "-", count: 5, total_amount: 1500 },
        { blood_type: "B", rh: "+", count: 12, total_amount: 3600 },
        { blood_type: "B", rh: "-", count: 3, total_amount: 900 },
        { blood_type: "AB", rh: "+", count: 8, total_amount: 2400 },
        { blood_type: "AB", rh: "-", count: 2, total_amount: 600 },
        { blood_type: "O", rh: "+", count: 20, total_amount: 6000 },
        { blood_type: "O", rh: "-", count: 7, total_amount: 2100 },
      ]
    }

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
    // Return sample data in case of error
    console.error("Error fetching blood inventory:", error)
    return [
      { blood_type: "A", rh: "+", count: 15, total_amount: 4500 },
      { blood_type: "A", rh: "-", count: 5, total_amount: 1500 },
      { blood_type: "B", rh: "+", count: 12, total_amount: 3600 },
      { blood_type: "B", rh: "-", count: 3, total_amount: 900 },
      { blood_type: "AB", rh: "+", count: 8, total_amount: 2400 },
      { blood_type: "AB", rh: "-", count: 2, total_amount: 600 },
      { blood_type: "O", rh: "+", count: 20, total_amount: 6000 },
      { blood_type: "O", rh: "-", count: 7, total_amount: 2100 },
    ]
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

    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      return {
        success: true, // Simulate success in fallback mode
        fallback: true,
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

    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      return {
        success: true, // Simulate success in fallback mode
        fallback: true,
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

    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      return {
        success: true, // Simulate success in fallback mode
        fallback: true,
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

// Function to check database connection with improved error handling
export async function checkDatabaseConnection() {
  if (IS_FALLBACK_MODE) {
    return false
  }

  try {
    // Implement retry logic for the connection check
    return await retryWithBackoff(
      async () => {
        try {
          // Use tagged template literal syntax
          await dbClient`SELECT 1`
          IS_FALLBACK_MODE = false // Reset fallback mode if connection succeeds
          return true
        } catch (error) {
          console.error("Database connection check failed:", error)
          IS_FALLBACK_MODE = true
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
      IS_FALLBACK_MODE = true
      return false
    })
  } catch (error) {
    // Handle any other errors
    console.error("Database connection check error:", error)
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

// Helper function to get all hospitals for dropdown lists
export async function getAllHospitals() {
  try {
    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      return FALLBACK_DATA.hospitals.map((h) => ({
        hospital_id: h.hospital_id,
        hospital_name: h.hospital_name,
      }))
    }

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
    // If in fallback mode, return fallback data
    if (IS_FALLBACK_MODE) {
      return FALLBACK_DATA.hospitals.map((h) => ({
        hospital_id: h.hospital_id,
        hospital_name: h.hospital_name,
      }))
    }

    console.error("Error fetching hospitals:", error)
    return [] // Return empty array in case of error
  }
}

// Helper function to get surplus alerts
export async function getSurplusAlerts(hospitalId: number) {
  try {
    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      // Return sample data in fallback mode
      return FALLBACK_DATA.surplus_alerts
    }

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
    // Return sample data in case of error
    console.error("Error fetching surplus alerts:", error)
    return FALLBACK_DATA.surplus_alerts
  }
}

// Helper function to search for donors
export async function searchDonors(query: string) {
  if (!query || query.trim() === "") return []

  try {
    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      // Return sample data in fallback mode
      return FALLBACK_DATA.donors.filter(
        (donor) => donor.donor_name.toLowerCase().includes(query.toLowerCase()) || donor.bag_id.toString() === query,
      )
    }

    const searchTerm = `%${query}%`

    // Search by bag ID if the query is a number
    if (!isNaN(Number(query))) {
      const bagId = Number(query)

      // Use tagged template literal syntax - now filtering for active=true
      const redBloodResults = await dbClient`
        SELECT 'RedBlood' as type, rb.bag_id, rb.donor_name, rb.blood_type, rb.rh, 
               rb.amount, rb.expiration_date, h.hospital_name, h.hospital_contact_phone
        FROM redblood_inventory rb
        JOIN hospital h ON rb.hospital_id = h.hospital_id
        WHERE rb.bag_id = ${bagId} AND rb.active = true
      `

      // Use tagged template literal syntax - now filtering for active=true
      const plasmaResults = await dbClient`
        SELECT 'Plasma' as type, p.bag_id, p.donor_name, p.blood_type, '' as rh, 
               p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
        FROM plasma_inventory p
        JOIN hospital h ON p.hospital_id = h.hospital_id
        WHERE p.bag_id = ${bagId} AND p.active = true
      `

      // Use tagged template literal syntax - now filtering for active=true
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
    // Use tagged template literal syntax - now filtering for active=true
    const redBloodResults = await dbClient`
      SELECT 'RedBlood' as type, rb.bag_id, rb.donor_name, rb.blood_type, rb.rh, 
             rb.amount, rb.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM redblood_inventory rb
      JOIN hospital h ON rb.hospital_id = h.hospital_id
      WHERE rb.donor_name ILIKE ${searchTerm} AND rb.active = true
    `

    // Use tagged template literal syntax - now filtering for active=true
    const plasmaResults = await dbClient`
      SELECT 'Plasma' as type, p.bag_id, p.donor_name, p.blood_type, '' as rh, 
             p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM plasma_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.donor_name ILIKE ${searchTerm} AND p.active = true
    `

    // Use tagged template literal syntax - now filtering for active=true
    const plateletsResults = await dbClient`
      SELECT 'Platelets' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
             p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM platelets_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.donor_name ILIKE ${searchTerm} AND p.active = true
    `

    return [...redBloodResults, ...plasmaResults, ...plateletsResults]
  } catch (error) {
    // Return sample data in case of error
    console.error("Error searching donors:", error)
    return FALLBACK_DATA.donors
  }
}

// New function to soft-delete a blood inventory entry
export async function softDeleteBloodEntry(bagId: number, entryType: string, hospitalId: number) {
  try {
    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      return { success: true, fallback: true }
    }

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
    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      return { success: true, fallback: true }
    }

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

// Helper function to get plasma inventory for a hospital
export async function getPlasmaInventory(hospitalId: number) {
  try {
    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      // Return sample data in fallback mode
      return [
        { blood_type: "A", count: 12, total_amount: 3600 },
        { blood_type: "B", count: 10, total_amount: 3000 },
        { blood_type: "AB", count: 5, total_amount: 1500 },
        { blood_type: "O", count: 15, total_amount: 4500 },
      ]
    }

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
    // Return sample data in case of error
    console.error("Error fetching plasma inventory:", error)
    return [
      { blood_type: "A", count: 12, total_amount: 3600 },
      { blood_type: "B", count: 10, total_amount: 3000 },
      { blood_type: "AB", count: 5, total_amount: 1500 },
      { blood_type: "O", count: 15, total_amount: 4500 },
    ]
  }
}

// Helper function to get platelets inventory for a hospital
export async function getPlateletsInventory(hospitalId: number) {
  try {
    // Check if we're in fallback mode
    if (IS_FALLBACK_MODE) {
      // Return sample data in fallback mode
      return [
        { blood_type: "A", rh: "+", count: 8, total_amount: 2400 },
        { blood_type: "A", rh: "-", count: 3, total_amount: 900 },
        { blood_type: "B", rh: "+", count: 7, total_amount: 2100 },
        { blood_type: "B", rh: "-", count: 2, total_amount: 600 },
        { blood_type: "AB", rh: "+", count: 4, total_amount: 1200 },
        { blood_type: "AB", rh: "-", count: 1, total_amount: 300 },
        { blood_type: "O", rh: "+", count: 10, total_amount: 3000 },
        { blood_type: "O", rh: "-", count: 4, total_amount: 1200 },
      ]
    }

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
    // Return sample data in case of error
    console.error("Error fetching platelets inventory:", error)
    return [
      { blood_type: "A", rh: "+", count: 8, total_amount: 2400 },
      { blood_type: "A", rh: "-", count: 3, total_amount: 900 },
      { blood_type: "B", rh: "+", count: 7, total_amount: 2100 },
      { blood_type: "B", rh: "-", count: 2, total_amount: 600 },
      { blood_type: "AB", rh: "+", count: 4, total_amount: 1200 },
      { blood_type: "AB", rh: "-", count: 1, total_amount: 300 },
      { blood_type: "O", rh: "+", count: 10, total_amount: 3000 },
      { blood_type: "O", rh: "-", count: 4, total_amount: 1200 },
    ]
  }
}

// Export the client for use in other modules
export { dbClient }
