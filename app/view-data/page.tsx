import type { Metadata } from "next"
import { requireAuth } from "@/lib/auth"
import ViewDataClient from "./view-data-client"

export const metadata: Metadata = {
  title: "View Data | Blood Bank",
  description: "View and manage blood inventory data",
}

export default async function ViewDataPage() {
  try {
    // Get session data
    const session = await requireAuth()
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
