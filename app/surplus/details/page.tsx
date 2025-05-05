import { requireAuth } from "@/lib/auth"
import { getHospitalById } from "@/lib/db"
import Header from "@/components/header"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function SurplusDetailsPage({
  searchParams,
}: {
  searchParams: { hospital?: string; type?: string; bloodType?: string; rh?: string }
}) {
  try {
    // Check authentication first
    const session = await requireAuth()
    const { hospitalId: currentHospitalId } = session

    // Get query parameters
    const hospitalId = searchParams.hospital ? Number.parseInt(searchParams.hospital) : null
    const type = searchParams.type || ""
    const bloodType = searchParams.bloodType || ""
    const rh = searchParams.rh || ""

    if (!hospitalId || !type || !bloodType) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h1 className="text-xl font-bold mb-4">Missing Information</h1>
            <p className="text-gray-600 mb-6">Required details are missing to display this page.</p>
            <Link
              href="/surplus"
              className="block text-center bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
            >
              Return to Surplus Management
            </Link>
          </div>
        </div>
      )
    }

    // Fetch hospital details
    const hospital = await getHospitalById(hospitalId)

    return (
      <div className="min-h-screen flex flex-col">
        <Header hospitalId={currentHospitalId} />

        <main className="flex-1 container py-6 px-4 md:py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Surplus Details</h1>
            <Link href="/surplus" className="text-sm text-primary hover:underline flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Back to Surplus Management</span>
            </Link>
          </div>

          <Suspense fallback={<Skeleton className="w-full h-96 rounded-lg" />}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {hospital.hospital_name} - {type}{" "}
                  <Badge className={getBloodTypeColor(bloodType, rh)}>{formatBloodType(bloodType, rh)}</Badge>
                </CardTitle>
                <CardDescription>Detailed information about this blood component</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Hospital Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>{" "}
                          <span className="font-medium">{hospital.hospital_name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Contact Email:</span>{" "}
                          <a href={`mailto:${hospital.hospital_contact_mail}`} className="text-primary hover:underline">
                            {hospital.hospital_contact_mail}
                          </a>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Contact Phone:</span>{" "}
                          <a href={`tel:${hospital.hospital_contact_phone}`} className="text-primary hover:underline">
                            {hospital.hospital_contact_phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Blood Component Details</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>{" "}
                          <span className="font-medium">{type}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Blood Type:</span>{" "}
                          <Badge className={getBloodTypeColor(bloodType, rh)}>{formatBloodType(bloodType, rh)}</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          <span className="font-medium">
                            {currentHospitalId === hospitalId ? "Your Surplus" : "Needed by Your Hospital"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentHospitalId === hospitalId ? (
                        <>
                          <Link
                            href={`/surplus/manage`}
                            className="bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
                          >
                            Manage Your Surplus
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`/surplus`}
                            className="bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
                          >
                            Request Transfer
                          </Link>
                          <a
                            href={`mailto:${hospital.hospital_contact_mail}?subject=Blood Component Transfer Request&body=Hello,%0D%0A%0D%0AWe are interested in a transfer of ${type} ${formatBloodType(bloodType, rh)} from your hospital.%0D%0A%0D%0APlease contact us at your earliest convenience.%0D%0A%0D%0AThank you.`}
                            className="bg-secondary text-secondary-foreground py-2 px-4 rounded hover:bg-secondary/90"
                          >
                            Contact via Email
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Suspense>
        </main>
      </div>
    )
  } catch (error) {
    console.error("Surplus details page error:", error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-bold mb-4">Error Loading Details</h1>
          <p className="text-gray-600 mb-6">
            There was an error loading the details page. Please try again later or contact support.
          </p>
          <Link
            href="/surplus"
            className="block text-center bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
          >
            Return to Surplus Management
          </Link>
        </div>
      </div>
    )
  }
}
