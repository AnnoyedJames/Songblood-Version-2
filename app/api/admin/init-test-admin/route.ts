import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    // Check if hospitals table exists, create if not
    await sql`
      CREATE TABLE IF NOT EXISTS hospitals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Check if admins table exists, create if not
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

    // Check if admin_sessions table exists, create if not
    await sql`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Insert a test hospital if none exists
    await sql`
      INSERT INTO hospitals (name, location)
      SELECT 'Central Hospital', 'Downtown'
      WHERE NOT EXISTS (SELECT 1 FROM hospitals LIMIT 1)
    `

    // Insert a test admin with plain text password if none exists
    await sql`
      INSERT INTO admins (username, password_hash, hospital_id)
      SELECT 'admin', 'password123', 1
      WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin')
    `

    // Get the results
    const hospitals = await sql`SELECT COUNT(*) as count FROM hospitals`
    const admins = await sql`SELECT COUNT(*) as count FROM admins`
    const adminDetails = await sql`SELECT id, username, hospital_id FROM admins`

    return NextResponse.json({
      success: true,
      message: "Test admin initialized successfully",
      hospitals: hospitals[0].count,
      admins: admins[0].count,
      adminDetails,
    })
  } catch (error) {
    console.error("Error initializing test admin:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize test admin",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
