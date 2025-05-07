import type { Metadata } from "next"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardClient from "./dashboard-client"

export const metadata: Metadata = {
  title: "Dashboard | Blood Bank",
  description: "Blood Bank Management System Dashboard",
}

export default async function DashboardPage() {
  try {
    // Get session data
    const session = await requireAuth()
    const { hospitalId, username } = session

    // Render the client component with the hospital ID
    return <DashboardClient hospitalId={hospitalId} username={username} />
  } catch (error) {
    console.error("Dashboard page error:", error)

    // If the error is a redirect, let it happen
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }

    // Redirect to login for other errors
    redirect("/login?reason=error")
  }
}
