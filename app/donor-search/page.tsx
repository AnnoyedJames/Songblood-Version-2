import { requireAuth } from "@/lib/auth"
import Header from "@/components/header"
import DonorSearchForm from "./donor-search-form"
import { redirect } from "next/navigation"

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

    // Return a simple error message instead of redirecting
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-xl font-bold mb-4">Session Error</h1>
          <p className="mb-4">There was an error loading your session. Please try logging in again.</p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }
}
