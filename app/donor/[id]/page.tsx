import { requireAuth } from "@/lib/auth"
import { getHospitalById } from "@/lib/db"
import Header from "@/components/header"
import { redirect } from "next/navigation"
import DatabaseError from "@/components/database-error"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { executeSQL } from "@/lib/db-connection"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Droplets, BoneIcon as Blood, FlaskConical } from "lucide-react"

export default async function DonorPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { type: string }
}) {
  try {
    const session = await requireAuth()

    // If no session, redirect to login
    if (!session) {
      redirect("/login?reason=no-session")
    }

    const { hospitalId } = session
    const bagId = Number.parseInt(params.id)
    const type = searchParams.type || "redblood"

    if (isNaN(bagId)) {
      return <DatabaseError message="Invalid donor ID" />
    }

    try {
      // Fetch hospital data
      const hospital = await getHospitalById(hospitalId)

      // Determine which table to query based on type
      let tableName = ""
      let typeLabel = ""
      let typeIcon = null

      switch (type) {
        case "redblood":
          tableName = "redblood_inventory"
          typeLabel = "Red Blood Cell"
          typeIcon = <Blood className="h-5 w-5 mr-2" />
          break
        case "plasma":
          tableName = "plasma_inventory"
          typeLabel = "Plasma"
          typeIcon = <Droplets className="h-5 w-5 mr-2" />
          break
        case "platelets":
          tableName = "platelets_inventory"
          typeLabel = "Platelets"
          typeIcon = <FlaskConical className="h-5 w-5 mr-2" />
          break
        default:
          return <DatabaseError message="Invalid inventory type" />
      }

      // Fetch the donation details
      const donationResult = await executeSQL(
        `SELECT d.*, h.hospital_name 
         FROM ${tableName} d
         JOIN hospital h ON d.hospital_id = h.hospital_id
         WHERE d.bag_id = $1`,
        bagId,
      )

      if (donationResult.length === 0) {
        return <DatabaseError message="Donation not found" />
      }

      const donation = donationResult[0]

      return (
        <div className="min-h-screen flex flex-col">
          <Header hospitalId={hospitalId} hospitalName={hospital?.hospital_name} />

          <main className="flex-1 container py-6 px-4 md:py-8">
            <div className="mb-6">
              <Button asChild variant="outline" size="sm">
                <Link href="/edit-supply" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Inventory
                </Link>
              </Button>
            </div>

            <h1 className="text-2xl font-bold mb-6">Donor Details</h1>

            <div className="max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      {typeIcon}
                      <span>
                        {typeLabel} Donation #{donation.bag_id}
                      </span>
                    </CardTitle>
                    <Badge className={getBloodTypeColor(donation.blood_type, donation.rh)}>
                      {formatBloodType(donation.blood_type, donation.rh)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Donor Name</dt>
                      <dd className="text-lg">{donation.donor_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Amount</dt>
                      <dd className="text-lg">{donation.amount} ml</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Expiration Date</dt>
                      <dd className="text-lg">{formatDate(donation.expiration_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Hospital</dt>
                      <dd className="text-lg">{donation.hospital_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Donation Date</dt>
                      <dd className="text-lg">{donation.creation_date ? formatDate(donation.creation_date) : "N/A"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      )
    } catch (error) {
      console.error("Database error:", error)
      return <DatabaseError />
    }
  } catch (error) {
    console.error("Donor page error:", error)

    // If the error is a redirect, let it happen
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }

    // Return a simple error message instead of redirecting
    return <DatabaseError message="Session error. Please log in again." />
  }
}
