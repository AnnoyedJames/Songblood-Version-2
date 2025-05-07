import type { Metadata } from "next"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isPreviewEnvironment } from "@/lib/env-utils"
import DashboardClient from "./dashboard-client"

export const metadata: Metadata = {
  title: "Dashboard | Blood Bank",
  description: "Blood Bank Management System Dashboard",
}

export default async function DashboardPage() {
  try {
    // Get session data or use mock data in preview environments
    let session

    if (isPreviewEnvironment()) {
      console.log("[Preview Mode] Using mock session for dashboard page")
      session = {
        adminId: 1,
        hospitalId: 1,
        username: "demo",
        isLoggedIn: true,
      }
    } else {
      try {
        session = await requireAuth()
      } catch (error) {
        console.error("Auth error:", error)
        // Use mock session if auth fails in development
        if (process.env.NODE_ENV === "development") {
          session = {
            adminId: 1,
            hospitalId: 1,
            username: "demo",
            isLoggedIn: true,
          }
        } else {
          // In production, redirect to login
          redirect("/login?reason=auth-error")
        }
      }
    }

    // If no session, redirect to login
    if (!session) {
      redirect("/login?reason=no-session")
    }

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
