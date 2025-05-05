import { requireAuth } from "@/lib/auth"
import {
  getEnhancedSurplusAlerts,
  getHospitalSurplus,
  getHospitalsNeedingSurplus,
  getSurplusSummary,
  getSurplusTransferHistory,
} from "@/lib/surplus-utils"
import Header from "@/components/header"
import EnhancedSurplusAlerts from "@/components/enhanced-surplus-alerts"
import SurplusSummaryCard from "@/components/surplus-summary-card"
import HospitalsNeedingSurplus from "@/components/hospitals-needing-surplus"
import SurplusTransferHistory from "@/components/surplus-transfer-history"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function SurplusPage() {
  try {
    // Check authentication first
    const session = await requireAuth()
    const { hospitalId } = session

    // Parallel data fetching for better performance
    const [alerts, hospitalSurplus, hospitalsNeeding, surplusSummary, transferHistory] = await Promise.all([
      getEnhancedSurplusAlerts(hospitalId),
      getHospitalSurplus(hospitalId),
      getHospitalsNeedingSurplus(hospitalId),
      getSurplusSummary(hospitalId),
      getSurplusTransferHistory(hospitalId),
    ])

    return (
      <div className="min-h-screen flex flex-col">
        <Header hospitalId={hospitalId} />

        <main className="flex-1 container py-6 px-4 md:py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Surplus Management</h1>
            <Link href="/dashboard" className="text-sm text-primary hover:underline flex items-center">
              <span>Back to Dashboard</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {/* Top section: Summary and Alerts side by side */}
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <Suspense fallback={<Skeleton className="w-full h-96 rounded-lg" />}>
              <SurplusSummaryCard
                initialSummary={surplusSummary}
                hospitalId={hospitalId}
                refreshInterval={30000}
                className="h-full"
              />
            </Suspense>

            <Suspense fallback={<Skeleton className="w-full h-96 rounded-lg" />}>
              <EnhancedSurplusAlerts
                initialAlerts={alerts}
                hospitalId={hospitalId}
                refreshInterval={30000}
                className="h-full"
              />
            </Suspense>
          </div>

          {/* Middle section: Hospitals needing surplus */}
          <div className="mb-8">
            <Suspense fallback={<Skeleton className="w-full h-96 rounded-lg" />}>
              <HospitalsNeedingSurplus
                initialHospitals={hospitalsNeeding}
                hospitalId={hospitalId}
                refreshInterval={30000}
              />
            </Suspense>
          </div>

          {/* Bottom section: Transfer history */}
          <div className="mb-8">
            <Suspense fallback={<Skeleton className="w-full h-96 rounded-lg" />}>
              <SurplusTransferHistory
                initialHistory={transferHistory}
                hospitalId={hospitalId}
                refreshInterval={30000}
                limit={10}
              />
            </Suspense>
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error("Surplus page error:", error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-bold mb-4">Error Loading Surplus Management</h1>
          <p className="text-gray-600 mb-6">
            There was an error loading the surplus management page. Please try again later or contact support.
          </p>
          <Link
            href="/dashboard"
            className="block text-center bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }
}
