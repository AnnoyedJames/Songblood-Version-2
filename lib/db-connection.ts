import { neon, neonConfig } from "@neondatabase/serverless"

// Configure Neon with optimized settings for reliability
neonConfig.fetchConnectionCache = true
neonConfig.fetchRetryTimeout = 10000 // 10 seconds timeout (increased from 5)
neonConfig.fetchRetryCount = 5 // Retry 5 times (increased from 3)
neonConfig.wsConnectionTimeoutMs = 30000 // 30 seconds for WebSocket connection timeout

// Connection status tracking
let lastConnectionAttempt = 0
let connectionStatus = {
  isConnected: false,
  lastChecked: 0,
  error: null as Error | null,
}

// Create a SQL client with enhanced error handling and connection tracking
export const createSqlClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  return neon(process.env.DATABASE_URL)
}

// Execute SQL with proper error handling and connection tracking
export const executeSQL = async (query: string, ...args: any[]) => {
  try {
    // Create a new SQL client for each execution
    const sqlClient = createSqlClient()

    // Track connection attempt
    lastConnectionAttempt = Date.now()

    // Execute the query
    const result = await sqlClient(query, ...args)

    // Update connection status on success
    connectionStatus = {
      isConnected: true,
      lastChecked: Date.now(),
      error: null,
    }

    return result
  } catch (error: any) {
    // Update connection status on failure
    connectionStatus = {
      isConnected: false,
      lastChecked: Date.now(),
      error,
    }

    console.error("Database connection error:", error)
    throw new Error(`Database connection failed: ${error.message}`)
  }
}

// Check database connection with a simple query
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Only perform a new check if the last check was more than 5 seconds ago
    // This prevents excessive connection attempts
    if (Date.now() - connectionStatus.lastChecked < 5000 && connectionStatus.lastChecked > 0) {
      return connectionStatus.isConnected
    }

    // Test connection with a simple query
    await executeSQL("SELECT 1 as connection_test")
    return true
  } catch (error) {
    console.error("Database connection check failed:", error)
    return false
  }
}

// Get detailed connection status
export const getConnectionStatus = () => {
  return {
    ...connectionStatus,
    lastConnectionAttempt,
    timeSinceLastCheck: Date.now() - connectionStatus.lastChecked,
  }
}
