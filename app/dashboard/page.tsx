import { Suspense } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"
import DatabaseError from "@/components/database-error"
import { AppError, ErrorType } from "@/lib/error-handling"
import Link from "next/link"
import { ChevronRight, Droplets } from "lucide-react"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataLoading } from "@/components/data-loading"
import { DataFetchError } from "@/components/data-fetch-error"

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

    // Default hospitalId if session doesn't have one
    const hospitalId = session?.hospitalId || 1

    // Initialize with empty arrays as fallbacks
    let hospital = null
    let redBlood = []
    let plasma = []
    let platelets = []
    let alerts = []

    try {
      try {
        // Fetch hospital data
        hospital = await getHospitalById(hospitalId)
      } catch (error) {
        console.error("Error fetching hospital data:", error)
        // Continue with null hospital data
      }

      try {
        // Fetch red blood cell data
        const redBloodData = await getBloodInventory(hospitalId)
        // Ensure redBlood is always an array
        redBlood = Array.isArray(redBloodData) ? redBloodData : []
        console.log("Dashboard - Red Blood Cell data:", JSON.stringify(redBlood, null, 2))
      } catch (error) {
        console.error("Error fetching red blood data:", error)
        redBlood = [] // Fallback to empty array
      }

      try {
        // Fetch plasma data
        const plasmaData = await getPlasmaInventory(hospitalId)
        // Ensure plasma is always an array
        plasma = Array.isArray(plasmaData) ? plasmaData : []
      } catch (error) {
        console.error("Error fetching plasma data:", error)
        plasma = [] // Fallback to empty array
      }

      try {
        // Fetch platelets data
        const plateletsData = await getPlateletsInventory(hospitalId)
        // Ensure platelets is always an array
        platelets = Array.isArray(plateletsData) ? plateletsData : []
      } catch (error) {
        console.error("Error fetching platelets data:", error)
        platelets = [] // Fallback to empty array
      }

      try {
        // Fetch surplus alerts
        const alertsData = await getSurplusAlerts(hospitalId)
        // Ensure alerts is always an array
        alerts = Array.isArray(alertsData) ? alertsData : []
      } catch (error) {
        console.error("Error fetching alerts data:", error)
        alerts = [] // Fallback to empty array
      }

      // Calculate accurate totals using Number() to ensure proper conversion
      // Use safe array access with fallbacks
      const redBloodUnits = Array.isArray(redBlood)
        ? redBlood.reduce((sum, item) => sum + Number(item?.count || 0), 0)
        : 0
      const redBloodAmount = Array.isArray(redBlood)
        ? redBlood.reduce((sum, item) => sum + Number(item?.total_amount || 0), 0)
        : 0

      console.log("Dashboard - Red Blood Cell totals:", { units: redBloodUnits, amount: redBloodAmount })

      // Calculate accurate totals using Number() to ensure proper conversion
      const plasmaUnits = Array.isArray(plasma) ? plasma.reduce((sum, item) => sum + Number(item?.count || 0), 0) : 0
      const plasmaAmount = Array.isArray(plasma)
        ? plasma.reduce((sum, item) => sum + Number(item?.total_amount || 0), 0)
        : 0

      const plateletsUnits = Array.isArray(platelets)
        ? platelets.reduce((sum, item) => sum + Number(item?.count || 0), 0)
        : 0
      const plateletsAmount = Array.isArray(platelets)
        ? platelets.reduce((sum, item) => sum + Number(item?.total_amount || 0), 0)
        : 0

      return (
        <div className="min-h-screen flex flex-col">
          <Header hospitalId={hospitalId} />

          <main className="flex-1 container py-6 px-4 md:py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <div className="flex gap-4">
                <Link href="/surplus" className="text-sm text-primary hover:underline flex items-center">
                  <Droplets className="h-4 w-4 mr-1" />
                  <span>Surplus Management</span>
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
                  redBlood={redBlood || []}
                  plasma={plasma || []}
                  platelets={platelets || []}
                  showThresholds={true}
                  className="h-full"
                />
              </Suspense>

              {/* Blood Inventory Warnings - Real-time Component */}
              <Suspense fallback={<Skeleton className="w-full h-96 rounded-lg" />}>
                <div className="relative h-full">
                  <RealTimeInventoryWarnings
                    initialRedBlood={redBlood || []}
                    initialPlasma={plasma || []}
                    initialPlatelets={platelets || []}
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
              <Suspense fallback={<DataLoading message="Loading surplus alerts..." className="py-8" />}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Surplus Alerts</h2>
                  <Link href="/surplus">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Droplets className="h-3.5 w-3.5" />
                      Manage Surplus
                    </Button>
                  </Link>
                </div>
                <SurplusAlerts alerts={alerts || []} />
              </Suspense>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Suspense fallback={<Skeleton className="w-full h-64 rounded-lg" />}>
                <InventoryTable title="Red Blood Cell Inventory" inventory={redBlood || []} showRh={true} />
              </Suspense>

              <Suspense fallback={<Skeleton className="w-full h-64 rounded-lg" />}>
                <InventoryTable title="Plasma Inventory" inventory={plasma || []} />
              </Suspense>

              <Suspense fallback={<Skeleton className="w-full h-64 rounded-lg" />}>
                <InventoryTable title="Platelets Inventory" inventory={platelets || []} showRh={true} />
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

      // Return a data fetch error component with retry option
      return (
        <div className="min-h-screen flex flex-col">
          <Header hospitalId={hospitalId} />
          <main className="flex-1 container py-6 px-4 md:py-8">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <DataFetchError
              message="Failed to load dashboard data"
              details={error instanceof Error ? error.message : "Unknown error occurred"}
              onRetry={() => window.location.reload()}
              className="max-w-3xl mx-auto"
            />
          </main>
        </div>
      )
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
