import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Check database connection
    const connectionTest = await sql`SELECT NOW() as server_time`

    // Check tables
    const tables = {
      admins: await checkTable("admins"),
      admin_sessions: await checkTable("admin_sessions"),
      hospitals: await checkTable("hospitals"),
    }

    // Check admin accounts
    const adminAccounts = await getAdminAccounts()

    return NextResponse.json({
      connection: {
        success: true,
        serverTime: connectionTest[0].server_time,
      },
      tables,
      adminAccounts,
    })
  } catch (error) {
    console.error("Error checking database:", error)
    return NextResponse.json(
      {
        connection: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    )
  }
}

async function checkTable(tableName: string) {
  try {
    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ) as exists
    `

    if (!tableExists[0].exists) {
      return { exists: false }
    }

    // Get count
    const countResult = await sql`
      SELECT COUNT(*) as count FROM ${tableName}
    `

    // Get columns
    const columnsResult = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    `

    return {
      exists: true,
      count: Number.parseInt(countResult[0].count),
      columns: columnsResult,
    }
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function getAdminAccounts() {
  try {
    // Check if admins table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      ) as exists
    `

    if (!tableExists[0].exists) {
      return { exists: false }
    }

    // Get admin accounts (without exposing full password hashes)
    const admins = await sql`
      SELECT 
        id, 
        username, 
        hospital_id,
        CASE 
          WHEN password_hash IS NULL THEN 'NULL'
          WHEN password_hash = '' THEN 'EMPTY'
          WHEN length(password_hash) < 10 THEN password_hash
          ELSE substring(password_hash, 1, 5) || '...' || substring(password_hash, length(password_hash) - 5, 5)
        END as password_hash_preview,
        length(password_hash) as password_hash_length,
        created_at
      FROM admins
    `

    return {
      exists: true,
      count: admins.length,
      admins,
    }
  } catch (error) {
    console.error("Error getting admin accounts:", error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
