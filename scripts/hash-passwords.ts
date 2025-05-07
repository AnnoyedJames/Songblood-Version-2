/**
 * Script to hash all plain text passwords in the database
 * Run with: npx ts-node scripts/hash-passwords.ts
 */

import { neon } from "@neondatabase/serverless"
import * as bcrypt from "bcryptjs"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config()

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.error("DATABASE_URL environment variable is not set")
  process.exit(1)
}

async function hashPasswords() {
  try {
    console.log("Connecting to database...")
    const client = neon(dbUrl)

    // Get all admins
    console.log("Fetching admins...")
    const admins = await client("SELECT id, username, password_hash FROM admins")
    console.log(`Found ${admins.length} admins`)

    // Process each admin
    for (const admin of admins) {
      const { id, username, password_hash } = admin

      // Skip if already hashed
      if (password_hash.startsWith("$2")) {
        console.log(`Admin ${username} (ID: ${id}) already has a hashed password`)
        continue
      }

      // Hash the password
      console.log(`Hashing password for admin ${username} (ID: ${id})`)
      const hashedPassword = await bcrypt.hash(password_hash, 10)

      // Update the admin record
      await client(
        "UPDATE admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        hashedPassword,
        id,
      )
      console.log(`Updated password for admin ${username} (ID: ${id})`)
    }

    console.log("Password hashing complete")
  } catch (error) {
    console.error("Error hashing passwords:", error)
    process.exit(1)
  }
}

// Run the script
hashPasswords()
