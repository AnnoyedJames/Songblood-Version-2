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
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default async function DashboardPage() {
  const session = await requireAuth()
  const { hospitalId } = session

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

  // Calculate accurate totals using Number() to ensure proper conversion
  const redBloodUnits = redBlood.reduce((sum, item) => sum + Number(item.count || 0), 0)
  const redBloodAmount = redBlood.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)

  const plasmaUnits = plasma.reduce((sum, item) => sum + Number(item.count || 0), 0)
  const plasmaAmount = plasma.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)

  const plateletsUnits = platelets.reduce((sum, item) => sum + Number(item.count || 0), 0)
  const plateletsAmount = platelets.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)

  return (
    <div className="min-h-screen flex flex-col">
      <Header hospitalId={hospitalId} />

      <main className="flex-1 container py-6 px-4 md:py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

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

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <Suspense fallback={<Skeleton className="w-full h-96 rounded-lg" />}>
              <BloodInventoryChart redBlood={redBlood} plasma={plasma} platelets={platelets} />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={<Skeleton className="w-full h-96 rounded-lg" />}>
              <SurplusAlerts alerts={alerts} />
            </Suspense>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={<Skeleton className="w-full h-64 rounded-lg" />}>
            <InventoryTable title="Red Blood Cell Inventory" inventory={redBlood} showRh={true} />
          </Suspense>

          <Suspense fallback={<Skeleton className="w-full h-64 rounded-lg" />}>
            <InventoryTable title="Plasma Inventory" inventory={plasma} />
          </Suspense>

          <Suspense fallback={<Skeleton className="w-full h-64 rounded-lg" />}>
            <InventoryTable title="Platelets Inventory" inventory={platelets} showRh={true} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
