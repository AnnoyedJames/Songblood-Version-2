import { requireAuth } from "@/lib/auth"
import Header from "@/components/header"
import DonorSearchForm from "./donor-search-form"
import { redirect } from "next/navigation"
import { AppError, ErrorType } from "@/lib/error-handling"
import DatabaseError from "@/components/database-error"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function DonorSearchPage() {
  try {
    const session = await requireAuth()

    // If no session, redirect to login
    if (!session) {
      redirect("/login?reason=no-session")
    }

    const { hospitalId } = session

    return (
      <div className="min-h-screen flex flex-col">
        <Header hospitalId={hospitalId} />

        <main className="flex-1 container py-6 px-4 md:py-8">
          <h1 className="text-2xl font-bold mb-6">Donor Search</h1>

          <div className="max-w-4xl mx-auto">
            <DonorSearchForm />
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error("Donor search page error:", error)

    // If the error is a redirect, let it happen
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }

    // Handle database connection errors
    if (error instanceof AppError && error.type === ErrorType.DATABASE_CONNECTION) {
      return <DatabaseError message="Unable to load donor search. Database connection failed." />
    }

    // Return a simple error message for other errors
    return (
      <DatabaseError
        message="There was an error loading your session. Please try logging in again."
        showHomeLink={false}
      />
    )
  }
}
