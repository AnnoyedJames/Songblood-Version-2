import { NextResponse } from "next/server"
import { checkDatabaseConnection, isFallbackMode } from "@/lib/db"

export async function GET() {
  try {
    const isConnected = await checkDatabaseConnection()

    return NextResponse.json({
      connected: isConnected,
      fallbackMode: isFallbackMode(),
    })
  } catch (error) {
    console.error("Connection check error:", error)
    return NextResponse.json({
      connected: false,
      fallbackMode: true,
      error: "Failed to check database connection",
    })
  }
}
