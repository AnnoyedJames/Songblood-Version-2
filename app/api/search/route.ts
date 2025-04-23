import { NextResponse } from "next/server"
import { searchDonors } from "@/lib/db"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    // Get session
    const cookieStore = cookies()
    const adminId = cookieStore.get("adminId")?.value
    const hospitalId = cookieStore.get("hospitalId")?.value

    if (!adminId || !hospitalId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get search query
    const url = new URL(request.url)
    const query = url.searchParams.get("q") || ""

    // Search donors
    const results = await searchDonors(query)

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error("Search error:", error)
    return NextResponse.json({ success: false, error: error.message || "An error occurred" }, { status: 500 })
  }
}
