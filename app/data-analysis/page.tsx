import { requireAuth } from "@/lib/auth"
import Header from "@/components/header"
import DataAnalysisContent from "@/components/data-analysis-content"
import { redirect } from "next/navigation"
import { AppError, ErrorType } from "@/lib/error-handling"
import DatabaseError from "@/components/database-error"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function DataAnalysisPage() {
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
          <h1 className="text-2xl font-bold mb-6">Data Analysis</h1>

          <div className="max-w-6xl mx-auto">
            <DataAnalysisContent />
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error("Data analysis page error:", error)

    // If the error is a redirect, let it happen
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }

    // Handle database connection errors
    if (error instanceof AppError && error.type === ErrorType.DATABASE_CONNECTION) {
      return <DatabaseError message="Unable to load data analysis. Database connection failed." />
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
