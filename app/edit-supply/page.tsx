import { requireAuth } from "@/lib/auth"
import { getHospitalById, getBloodInventory, getPlasmaInventory, getPlateletsInventory } from "@/lib/db"
import Header from "@/components/header"
import { redirect } from "next/navigation"
import DatabaseError from "@/components/database-error"
import InventoryManager from "./inventory-manager"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default async function EditSupplyPage() {
  try {
    const session = await requireAuth()

    // If no session, redirect to login
    if (!session) {
      redirect("/login?reason=no-session")
    }

    const { hospitalId } = session

    try {
      // Fetch hospital data and all inventory data in parallel
      const [hospital, redBlood, plasma, platelets] = await Promise.all([
        getHospitalById(hospitalId),
        getBloodInventory(hospitalId),
        getPlasmaInventory(hospitalId),
        getPlateletsInventory(hospitalId),
      ])

      return (
        <div className="min-h-screen flex flex-col">
          <Header hospitalId={hospitalId} hospitalName={hospital?.hospital_name} />

          <main className="flex-1 container py-6 px-4 md:py-8">
            <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>

            <Suspense fallback={<Skeleton className="w-full h-[500px]" />}>
              <InventoryManager hospitalId={hospitalId} redBlood={redBlood} plasma={plasma} platelets={platelets} />
            </Suspense>
          </main>
        </div>
      )
    } catch (error) {
      console.error("Database error:", error)
      return <DatabaseError />
    }
  } catch (error) {
    console.error("Edit supply page error:", error)

    // If the error is a redirect, let it happen
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }

    // Return a simple error message instead of redirecting
    return <DatabaseError message="Session error. Please log in again." />
  }
}
