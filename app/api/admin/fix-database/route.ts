import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import * as bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    // Handle different fix actions
    switch (action) {
      case "create_tables":
        return await createTables()
      case "create_test_admin":
        return await createTestAdmin()
      case "fix_password_hashes":
        return await fixPasswordHashes()
      case "reset_admin_password":
        const { username } = body
        if (!username) {
          return NextResponse.json({ error: "Username is required" }, { status: 400 })
        }
        return await resetAdminPassword(username)
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error fixing database:", error)
    return NextResponse.json(
      {
        error: "Failed to fix database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function createTables() {
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

    // Create admin_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    return NextResponse.json({
      success: true,
      message: "Tables created successfully",
    })
  } catch (error) {
    console.error("Error creating tables:", error)
    return NextResponse.json(
      {
        error: "Failed to create tables",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function createTestAdmin() {
  try {
    // Check if hospitals table exists
    const hospitalTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hospitals'
      ) as exists
    `

    if (!hospitalTableExists[0].exists) {
      return NextResponse.json(
        {
          error: "Hospitals table does not exist",
          details: "Please create tables first",
        },
        { status: 400 },
      )
    }

    // Insert a test hospital if none exists
    await sql`
      INSERT INTO hospitals (name, location)
      SELECT 'Central Hospital', 'Downtown'
      WHERE NOT EXISTS (SELECT 1 FROM hospitals LIMIT 1)
    `

    // Hash the password
    const hashedPassword = await bcrypt.hash("password123", 10)

    // Insert a test admin with hashed password
    await sql`
      INSERT INTO admins (username, password_hash, hospital_id)
      SELECT 'admin', ${hashedPassword}, 1
      WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin')
    `

    // Get the results
    const hospitals = await sql`SELECT COUNT(*) as count FROM hospitals`
    const admins = await sql`SELECT COUNT(*) as count FROM admins`

    return NextResponse.json({
      success: true,
      message: "Test admin created successfully",
      hospitals: hospitals[0].count,
      admins: admins[0].count,
    })
  } catch (error) {
    console.error("Error creating test admin:", error)
    return NextResponse.json(
      {
        error: "Failed to create test admin",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function fixPasswordHashes() {
  try {
    // Get all admins with plain text passwords
    const admins = await sql`
      SELECT id, username, password_hash
      FROM admins
      WHERE password_hash IS NOT NULL
      AND password_hash != ''
      AND NOT (password_hash LIKE '$2%')
    `

    if (admins.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No plain text passwords found",
        count: 0,
      })
    }

    // Hash each plain text password
    let updatedCount = 0
    for (const admin of admins) {
      const hashedPassword = await bcrypt.hash(admin.password_hash, 10)

      await sql`
        UPDATE admins
        SET password_hash = ${hashedPassword},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${admin.id}
      `

      updatedCount++
    }

    return NextResponse.json({
      success: true,
      message: "Password hashes fixed successfully",
      count: updatedCount,
    })
  } catch (error) {
    console.error("Error fixing password hashes:", error)
    return NextResponse.json(
      {
        error: "Failed to fix password hashes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function resetAdminPassword(username: string) {
  try {
    // Check if admin exists
    const adminExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM admins WHERE username = ${username}
      ) as exists
    `

    if (!adminExists[0].exists) {
      return NextResponse.json(
        {
          error: "Admin not found",
          details: `No admin found with username: ${username}`,
        },
        { status: 404 },
      )
    }

    // Hash the new password
    const newPassword = "password123"
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update the admin's password
    await sql`
      UPDATE admins
      SET password_hash = ${hashedPassword},
          updated_at = CURRENT_TIMESTAMP
      WHERE username = ${username}
    `

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for admin: ${username}`,
      newPassword,
    })
  } catch (error) {
    console.error("Error resetting admin password:", error)
    return NextResponse.json(
      {
        error: "Failed to reset admin password",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
