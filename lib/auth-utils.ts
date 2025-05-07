import { sql } from "@/lib/db"
import { AppError, ErrorType } from "@/lib/error-handling"
import * as bcrypt from "bcryptjs"

/**
 * Verifies admin credentials and returns the admin ID if valid
 * @param username Admin username
 * @param password Admin password
 * @returns Admin ID if credentials are valid, null otherwise
 */
export async function verifyAdminCredentials(username: string, password: string): Promise<number | null> {
  try {
    console.log(`Verifying credentials for username: ${username}`)

    // Query the database for the admin with the given username
    // Using raw SQL to avoid any issues with tagged template literals
    const result = await sql`
      SELECT id, hospital_id, password_hash
      FROM admins
      WHERE username = ${username}
    `

    console.log("Query result:", JSON.stringify(result))

    // If no admin found with the given username
    if (!result || result.length === 0) {
      console.log(`No admin found with username: ${username}`)
      return null
    }

    const admin = result[0]
    console.log(`Found admin with ID: ${admin.id}`)

    // For debugging, log the stored password hash
    console.log(`Stored password hash: ${admin.password_hash}`)
    console.log(`Provided password: ${password}`)

    // Check if the database is using plain text passwords (temporary solution)
    if (admin.password_hash === password) {
      console.log("Using plain text password comparison (not secure)")
      return admin.id
    }

    // Try to verify with bcrypt
    try {
      // If the password hash is in bcrypt format
      if (admin.password_hash && admin.password_hash.startsWith("$2")) {
        const passwordMatch = await bcrypt.compare(password, admin.password_hash)
        console.log("Bcrypt comparison result:", passwordMatch)

        if (passwordMatch) {
          console.log("Password verified with bcrypt")
          return admin.id
        } else {
          console.log("Password verification failed with bcrypt")
          return null
        }
      } else {
        console.log("Password hash is not in bcrypt format")
      }
    } catch (error) {
      console.error("Error comparing passwords with bcrypt:", error)
    }

    // If we get here, neither plain text nor bcrypt matched
    console.log("Password verification failed")
    return null
  } catch (error) {
    console.error("Error verifying admin credentials:", error)
    throw new AppError(
      `Failed to verify credentials: ${error instanceof Error ? error.message : "Unknown error"}`,
      ErrorType.DATABASE_CONNECTION,
    )
  }
}

/**
 * Hashes a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
