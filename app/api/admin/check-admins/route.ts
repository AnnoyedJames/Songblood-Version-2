import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Check if the admins table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      ) as exists
    `

    if (!tableExists[0].exists) {
      return NextResponse.json({
        exists: false,
        message: "Admins table does not exist",
      })
    }

    // Get all admins (without exposing password hashes)
    const admins = await sql`
      SELECT id, username, hospital_id, created_at
      FROM admins
    `

    // Count admins
    const count = await sql`SELECT COUNT(*) as count FROM admins`

    return NextResponse.json({
      exists: true,
      count: count[0].count,
      admins,
    })
  } catch (error) {
    console.error("Error checking admins:", error)
    return NextResponse.json(
      {
        error: "Failed to check admins",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
