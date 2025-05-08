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

    return NextResponse.json({
      connection: {
        success: true,
        serverTime: connectionTest[0].server_time,
      },
      tables,
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

    return {
      exists: true,
      count: Number.parseInt(countResult[0].count),
    }
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
