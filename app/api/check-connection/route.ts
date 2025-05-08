import { NextResponse } from "next/server"
import { testDatabaseConnection } from "@/lib/db-test"
import { isUsingFallbackMode } from "@/lib/db-config"

export async function GET() {
  // Check if we're in fallback mode
  if (isUsingFallbackMode()) {
    return NextResponse.json({
      success: true,
      fallbackMode: true,
      message: "Using development/preview mode with sample data",
    })
  }

  try {
    const result = await testDatabaseConnection()

    return NextResponse.json({
      success: result.success,
      fallbackMode: false,
      message: result.message,
    })
  } catch (error: any) {
    console.error("Error in check-connection API:", error)

    return NextResponse.json(
      {
        success: false,
        fallbackMode: false,
        message: `Connection check failed: ${error.message || "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
