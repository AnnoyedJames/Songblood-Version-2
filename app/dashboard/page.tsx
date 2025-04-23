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

export default async function DashboardPage() {
  const session = await requireAuth()
  const { hospitalId } = session

  // Fetch hospital data
  const hospital = await getHospitalById(hospitalId)

  // Fetch inventory data
  const redBlood = await getBloodInventory(hospitalId)
  const plasma = await getPlasmaInventory(hospitalId)
  const platelets = await getPlateletsInventory(hospitalId)

  // Fetch surplus alerts
  const alerts = await getSurplusAlerts(hospitalId)

  return (
    <div className="min-h-screen flex flex-col">
      <Header hospitalId={hospitalId} />

      <main className="flex-1 container py-6 px-4 md:py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-2">Red Blood Cells</h2>
            <div className="text-3xl font-bold text-red-600">
              {redBlood.reduce((sum, item) => sum + Number(item.count), 0)} units
            </div>
            <p className="text-muted-foreground">
              {redBlood.reduce((sum, item) => sum + Number(item.total_amount), 0).toLocaleString()} ml total
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-2">Plasma</h2>
            <div className="text-3xl font-bold text-amber-600">
              {plasma.reduce((sum, item) => sum + Number(item.count), 0)} units
            </div>
            <p className="text-muted-foreground">
              {plasma.reduce((sum, item) => sum + Number(item.total_amount), 0).toLocaleString()} ml total
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-2">Platelets</h2>
            <div className="text-3xl font-bold text-blue-600">
              {platelets.reduce((sum, item) => sum + Number(item.count), 0)} units
            </div>
            <p className="text-muted-foreground">
              {platelets.reduce((sum, item) => sum + Number(item.total_amount), 0).toLocaleString()} ml total
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <BloodInventoryChart redBlood={redBlood} plasma={plasma} platelets={platelets} />
          </div>
          <div>
            <SurplusAlerts alerts={alerts} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <InventoryTable title="Red Blood Cell Inventory" inventory={redBlood} showRh={true} />

          <InventoryTable title="Plasma Inventory" inventory={plasma} />

          <InventoryTable title="Platelets Inventory" inventory={platelets} showRh={true} />
        </div>
      </main>
    </div>
  )
}
