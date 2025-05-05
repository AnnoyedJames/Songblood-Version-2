import { requireAuth } from "@/lib/auth"
import { getSurplusTransferHistory } from "@/lib/surplus-utils"
import Header from "@/components/header"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBloodType, getBloodTypeColor, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function SurplusHistoryPage() {
  try {
    // Check authentication first
    const session = await requireAuth()
    const { hospitalId } = session

    // Fetch transfer history
    const transferHistory = await getSurplusTransferHistory(hospitalId)

    return (
      <div className="min-h-screen flex flex-col">
        <Header hospitalId={hospitalId} />

        <main className="flex-1 container py-6 px-4 md:py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Transfer History</h1>
            <Link href="/surplus" className="text-sm text-primary hover:underline flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Back to Surplus Management</span>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Complete Transfer History</CardTitle>
              <CardDescription>All blood component transfers involving your hospital</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="w-full h-96" />}>
                {transferHistory.length === 0 ? (
                  <div className="flex items-center justify-center p-8 text-muted-foreground">
                    No transfer history available.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Blood Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferHistory.map((item) => (
                        <TableRow key={item.transfer_id}>
                          <TableCell className="font-medium">{formatDate(new Date(item.transfer_date))}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>
                            <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                              {formatBloodType(item.blood_type, item.rh)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={item.from_hospital_id === hospitalId ? "font-semibold" : ""}>
                              {item.from_hospital_name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={item.to_hospital_id === hospitalId ? "font-semibold" : ""}>
                              {item.to_hospital_name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              {item.units} units
                              <div className="text-xs text-muted-foreground">{item.amount} ml</div>
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
    console.error("Surplus history page error:", error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-bold mb-4">Error Loading Transfer History</h1>
          <p className="text-gray-600 mb-6">
            There was an error loading the transfer history page. Please try again later or contact support.
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
