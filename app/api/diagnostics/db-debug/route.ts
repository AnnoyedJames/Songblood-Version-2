import { NextResponse } from "next/server"
import { checkDatabaseConfig, testSqlQuery } from "@/lib/db-debug"
import { cookies } from "next/headers"

// Force dynamic rendering for API routes that use cookies
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Get session
    const cookieStore = cookies()
    const adminId = cookieStore.get("adminId")?.value

    if (!adminId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if this is a test query
    const url = new URL(request.url)
    const testQuery = url.searchParams.get("query")

    if (testQuery) {
      // Parse parameters if provided
      const paramsStr = url.searchParams.get("params")
      const params = paramsStr ? JSON.parse(paramsStr) : []

      const result = await testSqlQuery(testQuery, params)
      return NextResponse.json(result)
    }

    // Otherwise, return database configuration information
    const dbConfig = await checkDatabaseConfig()
    return NextResponse.json(dbConfig)
  } catch (error: any) {
    console.error("Database debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
