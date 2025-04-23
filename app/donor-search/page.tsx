import { requireAuth } from "@/lib/auth"
import Header from "@/components/header"
import DonorSearchForm from "./donor-search-form"

export default async function DonorSearchPage() {
  const session = await requireAuth()
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
}
