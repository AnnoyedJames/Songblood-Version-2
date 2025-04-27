import { requireAuth } from "@/lib/auth"
import { getHospitalById } from "@/lib/db"
import Header from "@/components/header"
import DonorSearchForm from "./donor-search-form"
import { redirect } from "next/navigation"
import DatabaseError from "@/components/database-error"

export default async function DonorSearchPage() {
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
          <Header hospitalId={hospitalId} hospitalName={hospital?.hospital_name} />

          <main className="flex-1 container py-6 px-4 md:py-8">
            <h1 className="text-2xl font-bold mb-6">Donor Search</h1>

            <div className="max-w-4xl mx-auto">
              <DonorSearchForm />
            </div>
          </main>
        </div>
      )
    } catch (error) {
      console.error("Database error:", error)
      return <DatabaseError />
    }
  } catch (error) {
    console.error("Donor search page error:", error)

    // If the error is a redirect, let it happen
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }

    // Return a simple error message instead of redirecting
    return <DatabaseError message="Session error. Please log in again." />
  }
}
