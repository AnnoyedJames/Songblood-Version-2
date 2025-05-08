import { requireAuth } from "@/lib/auth"
import { getHospitalSurplus } from "@/lib/surplus-utils"
import Header from "@/components/header"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function ManageSurplusPage() {
  try {
    // Check authentication first
    const session = await requireAuth()
    const { hospitalId } = session

    // Fetch hospital surplus
    const hospitalSurplus = await getHospitalSurplus(hospitalId)

    return (
      <div className="min-h-screen flex flex-col">
        <Header hospitalId={hospitalId} />

        <main className="flex-1 container py-6 px-4 md:py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Surplus Inventory</h1>
            <Link href="/surplus" className="text-sm text-primary hover:underline flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Back to Surplus Management</span>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Surplus Inventory</CardTitle>
              <CardDescription>
                Blood components you have in surplus that can be shared with other hospitals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="w-full h-96" />}>
                {hospitalSurplus.length === 0 ? (
                  <div className="flex items-center justify-center p-8 text-muted-foreground">
                    You currently don't have any blood components in surplus.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Blood Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hospitalSurplus.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>
                            <Badge className={getBloodTypeColor(item.bloodType, item.rh)}>
                              {formatBloodType(item.bloodType, item.rh)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              {item.count} units
                              <div className="text-xs text-muted-foreground">
                                {item.totalAmount.toLocaleString()} ml
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.surplusLevel === "high-surplus" ? "default" : "outline"}>
                              {item.surplusLevel === "high-surplus" ? "High Surplus" : "Surplus"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link
                                href={`/surplus/details?hospital=${hospitalId}&type=${item.type}&bloodType=${item.bloodType}&rh=${item.rh}`}
                              >
                                <Button variant="outline" size="sm">
                                  Details
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Suspense>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  } catch (error) {
    console.error("Manage surplus page error:", error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-bold mb-4">Error Loading Surplus Inventory</h1>
          <p className="text-gray-600 mb-6">
            There was an error loading the surplus inventory page. Please try again later or contact support.
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
