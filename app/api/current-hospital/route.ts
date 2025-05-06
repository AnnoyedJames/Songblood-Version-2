import { NextResponse } from "next/server"
import { getSessionData } from "@/lib/session-utils"

export async function GET() {
  try {
    // Get session data to check if user is authenticated
    const session = await getSessionData()
    if (!session || !session.isLoggedIn) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    return NextResponse.json({ hospitalId: session.hospitalId })
  } catch (error) {
    console.error("Error in current hospital API:", error)

    return NextResponse.json({ error: "Failed to get current hospital. Please try again later." }, { status: 500 })
  }
}
