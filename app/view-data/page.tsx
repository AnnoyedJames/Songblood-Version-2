import type { Metadata } from "next"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isPreviewEnvironment } from "@/lib/env-utils"
import ViewDataClient from "./view-data-client"

export const metadata: Metadata = {
  title: "View Data | Blood Bank",
  description: "View and manage blood inventory data",
}

export default async function ViewDataPage() {
  try {
    // Get session data or use mock data in preview environments
    let session

    if (isPreviewEnvironment()) {
      console.log("[Preview Mode] Using mock session for view-data page")
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
          // In production, rethrow the error to be handled by the client
          throw error
        }
      }
    }

    // If no session, redirect to login
    if (!session) {
      redirect("/login?reason=no-session")
    }

    const { hospitalId } = session

    // Render the client component with the hospital ID
    return <ViewDataClient hospitalId={hospitalId} />
  } catch (error) {
    console.error("View data page error:", error)

    // If the error is a redirect, let it happen
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }

    // Pass the error to the client component
    return <ViewDataClient hospitalId={1} error={error instanceof Error ? error : new Error("Unknown error")} />
  }
}
