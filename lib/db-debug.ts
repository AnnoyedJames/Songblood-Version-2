import { neon } from "@neondatabase/serverless"
import { logError } from "./error-handling"

/**
 * Utility function to test SQL queries and debug database issues
 */
export async function testSqlQuery(query: string, params: any[] = []) {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        success: false,
        error: "DATABASE_URL environment variable is not defined",
        data: null,
      }
    }

    console.log("Testing SQL query:", query)
    console.log("With parameters:", params)

    const dbClient = neon(process.env.DATABASE_URL)

    // Execute the query
    const startTime = Date.now()
    const result = await dbClient.query(query, params)
    const endTime = Date.now()

    return {
      success: true,
      data: result,
      executionTime: endTime - startTime,
      query,
      params,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(error, "SQL Query Test")

    return {
      success: false,
      error: errorMessage,
      query,
      params,
    }
  }
}

/**
 * Utility function to check database connection and configuration
 */
export async function checkDatabaseConfig() {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        success: false,
        error: "DATABASE_URL environment variable is not defined",
      }
    }

    const dbClient = neon(process.env.DATABASE_URL)

    // Test connection with a simple query
    const result = await dbClient.query("SELECT version()")

    // Get database information
    const dbInfo = await dbClient.query(`
      SELECT 
        current_database() as database_name,
        current_schema() as current_schema,
        current_user as current_user
    `)

    // Get table information
    const tables = await dbClient.query(`
      SELECT 
        table_name,
        table_schema
      FROM 
        information_schema.tables
      WHERE 
        table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY 
        table_schema, table_name
    `)

    return {
      success: true,
      version: result[0].version,
      dbInfo: dbInfo[0],
      tables,
      connectionString: maskConnectionString(process.env.DATABASE_URL),
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(error, "Database Config Check")

    return {
      success: false,
      error: errorMessage,
      connectionString: maskConnectionString(process.env.DATABASE_URL),
    }
  }
}

/**
 * Utility function to mask sensitive information in connection string
 */
function maskConnectionString(connectionString: string) {
  try {
    // Create a URL object from the connection string
    const url = new URL(connectionString)

    // Mask the password
    if (url.password) {
      url.password = "********"
    }

    // Return the masked connection string
    return url.toString()
  } catch (error) {
    // If parsing fails, return a generic masked string
    return "postgres://username:********@hostname:port/database"
  }
}
