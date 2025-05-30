import { requireAuth } from "@/lib/auth"
import { getHospitalById } from "@/lib/db"
import Header from "@/components/header"
import AddEntryForm from "./add-entry-form"
import { redirect } from "next/navigation"
import { AppError, ErrorType } from "@/lib/error-handling"
import DatabaseError from "@/components/database-error"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function AddEntryPage() {
  try {
    const session = await requireAuth()

    // If no session, redirect to login
    if (!session) {
      redirect("/login?reason=no-session")
    }

    const { hospitalId } = session

    try {
      // Fetch hospital data
      const hospital = await getHospitalById(hospitalId)

      return (
        <div className="min-h-screen flex flex-col">
          <Header hospitalId={hospitalId} />

          <main className="flex-1 container py-6 px-4 md:py-8">
            <h1 className="text-2xl font-bold mb-6">Add New Entry</h1>

            <div className="max-w-2xl mx-auto">
              <AddEntryForm hospitalId={hospitalId} />
            </div>
          </main>
        </div>
      )
    } catch (error) {
      // Handle database connection errors
      if (error instanceof AppError && error.type === ErrorType.DATABASE_CONNECTION) {
        return <DatabaseError message="Unable to load entry management. Database connection failed." />
      }

      // Rethrow other errors to be handled by the error boundary
      throw error
    }
  } catch (error) {
    console.error("Add entry page error:", error)

    // If the error is a redirect, let it happen
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }

    // Return a simple error message instead of redirecting
    return (
      <DatabaseError
        message="There was an error loading your session. Please try logging in again."
        showHomeLink={false}
      />
    )
  }
}
