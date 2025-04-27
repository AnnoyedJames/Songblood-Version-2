import { NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/db-connection"

export async function GET() {
  try {
    const isConnected = await checkDatabaseConnection()

    return NextResponse.json({
      connected: isConnected,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Connection check error:", error)
    return NextResponse.json({
      connected: false,
      error: "Failed to check database connection",
      timestamp: new Date().toISOString(),
    })
  }
}
