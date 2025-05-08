import { type NextRequest, NextResponse } from "next/server"
import { requireApiAuth } from "@/lib/auth"
import { dbClient } from "@/lib/db"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireApiAuth(request)
    if (!session.success) {
      return NextResponse.json({ error: session.error }, { status: 401 })
    }

    // Get the migration file name from the request
    const { migrationFile } = await request.json()

    if (!migrationFile) {
      return NextResponse.json({ error: "Migration file name is required" }, { status: 400 })
    }

    // Validate the migration file name to prevent directory traversal
    if (!/^[a-zA-Z0-9-_.]+\.sql$/.test(migrationFile)) {
      return NextResponse.json({ error: "Invalid migration file name" }, { status: 400 })
    }

    // Get the migration file path
    const migrationFilePath = path.join(process.cwd(), "migrations", migrationFile)

    // Check if the file exists
    if (!fs.existsSync(migrationFilePath)) {
      return NextResponse.json({ error: `Migration file ${migrationFile} not found` }, { status: 404 })
    }

    // Read the migration file
    const migrationSql = fs.readFileSync(migrationFilePath, "utf8")

    // Execute the migration
    await dbClient.query(migrationSql)

    return NextResponse.json({ success: true, message: `Migration ${migrationFile} executed successfully` })
  } catch (error) {
    console.error("Error running migration:", error)
    return NextResponse.json(
      { error: "Failed to run migration", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
