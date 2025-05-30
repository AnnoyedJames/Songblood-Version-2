import { requireAuth } from "@/lib/auth"
import {
  getBloodInventory,
  getHospitalById,
  getPlasmaInventory,
  getPlateletsInventory,
  getSurplusAlerts,
} from "@/lib/db"
import Header from "@/components/header"
import BloodInventoryChart from "@/components/blood-inventory-chart"
import InventoryTable from "@/components/inventory-table"
import SurplusAlerts from "@/components/surplus-alerts"
import RealTimeInventoryWarnings from "@/components/real-time-inventory-warnings"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import DatabaseError from "@/components/database-error"
import { AppError, ErrorType } from "@/lib/error-handling"
import Link from "next/link"
import { ChevronRight, PlusCircle } from "lucide-react"
import { redirect } from "next/navigation"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  try {
    // Check authentication first
    let session
    try {
      session = await requireAuth()
    } catch (authError) {
      // Handle authentication errors by redirecting to login
      console.log("Authentication error in dashboard:", authError)
      redirect("/login?reason=login-required")
    }

    const { hospitalId } = session

    try {
      // Fetch hospital data
      const hospitalPromise = getHospitalById(hospitalId)

      // Parallel data fetching for better performance
      const [hospital, redBlood, plasma, platelets, alerts] = await Promise.all([
        hospitalPromise,
        getBloodInventory(hospitalId),
        getPlasmaInventory(hospitalId),
        getPlateletsInventory(hospitalId),
        getSurplusAlerts(hospitalId),
      ])

      // Ensure all data arrays are defined before using them
      const safeRedBlood = redBlood || []
      const safePlasma = plasma || []
      const safePlatelets = platelets || []
      const safeAlerts = alerts || []

      console.log("Dashboard - Red Blood Cell data:", JSON.stringify(safeRedBlood, null, 2))

      // Calculate accurate totals using Number() to ensure proper conversion
      const redBloodUnits = safeRedBlood.reduce((sum, item) => sum + Number(item.count || 0), 0)
      const redBloodAmount = safeRedBlood.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)

      console.log("Dashboard - Red Blood Cell totals:", { units: redBloodUnits, amount: redBloodAmount })

      // Calculate accurate totals using Number() to ensure proper conversion
      const plasmaUnits = safePlasma.reduce((sum, item) => sum + Number(item.count || 0), 0)
      const plasmaAmount = safePlasma.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)

      const plateletsUnits = safePlatelets.reduce((sum, item) => sum + Number(item.count || 0), 0)
      const plateletsAmount = safePlatelets.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)

      return (
        <div className="min-h-screen flex flex-col">
          <Header hospitalId={hospitalId} />

          <main className="flex-1 container py-6 px-4 md:py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <div className="flex items-center gap-4">
                <Link href="/add-entry" className="flex items-center text-sm text-primary hover:underline">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  <span>Add New Entry</span>
                </Link>
                <Link href="/diagnostics" className="text-sm text-primary hover:underline flex items-center">
                  <span>Data Diagnostics</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Top section: Chart and Warnings side by side */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              {/* Blood Inventory Chart with thresholds */}
              <Suspense fallback={<Skeleton className="w-full h-96 rounded-lg" />}>
                <BloodInventoryChart
                  redBlood={safeRedBlood}
                  plasma={safePlasma}
                  platelets={safePlatelets}
                  showThresholds={true}
                  className="h-full"
                />
              </Suspense>

              {/* Blood Inventory Warnings - Real-time Component */}
              <Suspense fallback={<Skeleton className="w-full h-96 rounded-lg" />}>
                <div className="relative h-full">
                  <RealTimeInventoryWarnings
                    initialRedBlood={safeRedBlood}
                    initialPlasma={safePlasma}
                    initialPlatelets={safePlatelets}
                    hospitalId={hospitalId}
                    refreshInterval={30000} // Refresh every 30 seconds
                    className="h-full"
                  />
                </div>
              </Suspense>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-2">Red Blood Cells</h2>
                <div className="text-3xl font-bold text-red-600">{redBloodUnits} units</div>
                <p className="text-muted-foreground">{redBloodAmount.toLocaleString()} ml total</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-2">Plasma</h2>
                <div className="text-3xl font-bold text-amber-600">{plasmaUnits} units</div>
                <p className="text-muted-foreground">{plasmaAmount.toLocaleString()} ml total</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-2">Platelets</h2>
                <div className="text-3xl font-bold text-blue-600">{plateletsUnits} units</div>
                <p className="text-muted-foreground">{plateletsAmount.toLocaleString()} ml total</p>
              </div>
            </div>

            <div className="mb-8">
              <Suspense fallback={<Skeleton className="w-full h-96 rounded-lg" />}>
                <SurplusAlerts alerts={safeAlerts} />
              </Suspense>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Suspense fallback={<Skeleton className="w-full h-64 rounded-lg" />}>
                <InventoryTable title="Red Blood Cell Inventory" inventory={safeRedBlood} showRh={true} />
              </Suspense>

              <Suspense fallback={<Skeleton className="w-full h-64 rounded-lg" />}>
                <InventoryTable title="Plasma Inventory" inventory={safePlasma} />
              </Suspense>

              <Suspense fallback={<Skeleton className="w-full h-64 rounded-lg" />}>
                <InventoryTable title="Platelets Inventory" inventory={safePlatelets} showRh={true} />
              </Suspense>
            </div>
          </main>
        </div>
      )
    } catch (error) {
      console.error("Dashboard data error:", error)

      // Handle database connection errors
      if (error instanceof AppError && error.type === ErrorType.DATABASE_CONNECTION) {
        return <DatabaseError message="Unable to load dashboard data. Database connection failed." />
      }

      // Rethrow other errors to be handled by the error boundary
      throw error
    }
  } catch (error) {
    console.error("Dashboard error:", error)

    // Return a simple error message instead of redirecting
    return (
      <DatabaseError
        message="There was an error loading your session. Please try logging in again."
        showHomeLink={true}
      />
    )
  }
}
