"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"

interface DashboardClientProps {
  hospitalId: number
  username: string
}

export default function DashboardClient({ hospitalId, username }: DashboardClientProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    redBloodCells: { total: 0, expiringSoon: 0 },
    plasma: { total: 0, expiringSoon: 0 },
    platelets: { total: 0, expiringSoon: 0 },
  })

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      // In a real app, you would fetch this data from an API
      // For now, we'll just simulate a delay and use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setStats({
        redBloodCells: { total: 125, expiringSoon: 12 },
        plasma: { total: 87, expiringSoon: 5 },
        platelets: { total: 43, expiringSoon: 8 },
      })
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header hospitalId={hospitalId} />

      <main className="flex-1 container py-6 px-4 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {username}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading} className="mt-2 md:mt-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {error ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center text-red-500">{error}</div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Red Blood Cells</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loading ? "-" : stats.redBloodCells.total} units</div>
                    <p className="text-xs text-muted-foreground">
                      {loading ? "-" : stats.redBloodCells.expiringSoon} expiring soon
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Plasma</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loading ? "-" : stats.plasma.total} units</div>
                    <p className="text-xs text-muted-foreground">
                      {loading ? "-" : stats.plasma.expiringSoon} expiring soon
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Platelets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loading ? "-" : stats.platelets.total} units</div>
                    <p className="text-xs text-muted-foreground">
                      {loading ? "-" : stats.platelets.expiringSoon} expiring soon
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="expiring">
              <Card>
                <CardHeader>
                  <CardTitle>Expiring Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    The following inventory items are expiring within the next 7 days.
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Red Blood Cells</span>
                      <span className="font-medium">{loading ? "-" : stats.redBloodCells.expiringSoon} units</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Plasma</span>
                      <span className="font-medium">{loading ? "-" : stats.plasma.expiringSoon} units</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Platelets</span>
                      <span className="font-medium">{loading ? "-" : stats.platelets.expiringSoon} units</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/view-data">View Data</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/add-entry">Add New Entry</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <p className="font-medium">New entry added</p>
                    <p className="text-sm text-muted-foreground">Red Blood Cells - A+ (450ml)</p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="font-medium">Entry updated</p>
                    <p className="text-sm text-muted-foreground">Plasma - AB (300ml)</p>
                  </div>
                  <div>
                    <p className="font-medium">Entry deleted</p>
                    <p className="text-sm text-muted-foreground">Platelets - O- (250ml)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
