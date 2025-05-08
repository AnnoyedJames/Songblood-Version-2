import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import * as bcrypt from "bcryptjs"

export async function POST() {
  try {
    // Create hospitals table
    await sql`
      CREATE TABLE IF NOT EXISTS hospitals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create admins table
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        hospital_id INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create admin_sessions table with proper indexes
    await sql`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create index on token for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token)
    `

    // Create index on expiration date for faster cleanup
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at)
    `

    // Insert a test hospital if none exists
    await sql`
      INSERT INTO hospitals (name, location)
      SELECT 'Central Hospital', 'Downtown'
      WHERE NOT EXISTS (SELECT 1 FROM hospitals LIMIT 1)
    `

    // Check if admin exists
    const adminExists = await sql`
      SELECT EXISTS (SELECT 1 FROM admins WHERE username = 'admin') as exists
    `

    if (!adminExists[0].exists) {
      // Create a default admin with bcrypt hashed password
      const hashedPassword = await bcrypt.hash("password123", 10)

      await sql`
        INSERT INTO admins (username, password_hash, hospital_id)
        VALUES ('admin', ${hashedPassword}, 1)
      `
    }

    // Clean up expired sessions
    await sql`
      DELETE FROM admin_sessions
      WHERE expires_at < NOW()
    `

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully with secure defaults",
    })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
