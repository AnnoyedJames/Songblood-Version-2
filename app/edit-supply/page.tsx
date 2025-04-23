import { requireAuth } from "@/lib/auth"
import { getHospitalById } from "@/lib/db"
import Header from "@/components/header"
import AddSupplyForm from "./add-supply-form"

export default async function EditSupplyPage() {
  const session = await requireAuth()
  const { hospitalId } = session

  // Fetch hospital data
  const hospital = await getHospitalById(hospitalId)

  return (
    <div className="min-h-screen flex flex-col">
      <Header hospitalId={hospitalId} />

      <main className="flex-1 container py-6 px-4 md:py-8">
        <h1 className="text-2xl font-bold mb-6">Edit Supply</h1>

        <div className="max-w-2xl mx-auto">
          <AddSupplyForm hospitalId={hospitalId} />
        </div>
      </main>
    </div>
  )
}
