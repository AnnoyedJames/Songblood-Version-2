"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { BarChart3, PieChart, RefreshCw } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"

export default function DataAnalysisContent() {
  // State for inventory data
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for filters
  const [filters, setFilters] = useState({
    bloodType: "",
    rhFactor: "",
    expirationStatus: "valid",
    showAllHospitals: false,
    startDate: "",
    endDate: "",
    inventoryType: "all", // "all", "redblood", "plasma", "platelets"
  })

  // Load inventory data
  const fetchAnalysisData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      if (filters.bloodType) params.append("bloodType", filters.bloodType)
      if (filters.rhFactor) params.append("rhFactor", filters.rhFactor)
      if (filters.expirationStatus) params.append("expirationStatus", filters.expirationStatus)
      if (filters.showAllHospitals) params.append("showAllHospitals", "true")
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      if (filters.inventoryType !== "all") params.append("inventoryType", filters.inventoryType)

      const response = await fetch(`/api/analysis/inventory?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch analysis data")
      }

      const data = await response.json()
      setAnalysisData(data.data)
    } catch (err) {
      console.error("Error fetching analysis data:", err)
      setError("Failed to load analysis data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchAnalysisData()
  }, [])

  // Refresh data when filters change
  useEffect(() => {
    fetchAnalysisData()
  }, [filters])

  // Handle filter changes
  const handleFilterChange = (name: string, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  // Handle date changes
  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      const formattedDate = date.toISOString().split("T")[0]
      setFilters((prev) => ({ ...prev, [name]: formattedDate }))
    } else {
      setFilters((prev) => ({ ...prev, [name]: "" }))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Blood Inventory Analysis</CardTitle>
          <CardDescription>Analyze blood inventory data with custom filters</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary">
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="byBloodType">By Blood Type</TabsTrigger>
              <TabsTrigger value="byExpiration">By Expiration</TabsTrigger>
              <TabsTrigger value="byHospital">By Hospital</TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="bg-slate-50 p-4 rounded-md mb-6">
              <h3 className="font-medium mb-3">Analysis Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="inventoryType">Inventory Type</Label>
                  <Select
                    value={filters.inventoryType}
                    onValueChange={(value) => handleFilterChange("inventoryType", value)}
                  >
                    <SelectTrigger id="inventoryType">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="redblood">Red Blood Cells</SelectItem>
                      <SelectItem value="plasma">Plasma</SelectItem>
                      <SelectItem value="platelets">Platelets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select value={filters.bloodType} onValueChange={(value) => handleFilterChange("bloodType", value)}>
                    <SelectTrigger id="bloodType">
                      <SelectValue placeholder="All Blood Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Blood Types</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="O">O</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rhFactor">Rh Factor</Label>
                  <Select value={filters.rhFactor} onValueChange={(value) => handleFilterChange("rhFactor", value)}>
                    <SelectTrigger id="rhFactor">
                      <SelectValue placeholder="All Rh Factors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rh Factors</SelectItem>
                      <SelectItem value="+">Positive (+)</SelectItem>
                      <SelectItem value="-">Negative (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expirationStatus">Expiration Status</Label>
                  <Select
                    value={filters.expirationStatus}
                    onValueChange={(value) => handleFilterChange("expirationStatus", value)}
                  >
                    <SelectTrigger id="expirationStatus">
                      <SelectValue placeholder="Expiration Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="valid">Valid</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="expiring-soon">Expiring Soon (7 days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <DatePicker placeholder="Start Date" onChange={(date) => handleDateChange("startDate", date)} />
                    </div>
                    <div>
                      <DatePicker placeholder="End Date" onChange={(date) => handleDateChange("endDate", date)} />
                    </div>
                  </div>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showAllHospitals"
                      checked={filters.showAllHospitals}
                      onCheckedChange={(checked) => handleFilterChange("showAllHospitals", checked === true)}
                    />
                    <Label htmlFor="showAllHospitals">Show all hospitals</Label>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      bloodType: "",
                      rhFactor: "",
                      expirationStatus: "valid",
                      showAllHospitals: false,
                      startDate: "",
                      endDate: "",
                      inventoryType: "all",
                    })
                  }}
                  className="mr-2"
                >
                  Reset Filters
                </Button>
                <Button onClick={fetchAnalysisData} className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                <p className="mt-2">Loading analysis data...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            ) : !analysisData ? (
              <div className="text-center py-8 text-gray-500">
                <p>No data available. Please adjust your filters and try again.</p>
              </div>
            ) : (
              <>
                <TabsContent value="summary">
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{analysisData.summary?.totalCount || 0}</div>
                          <p className="text-muted-foreground">Total Units</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{analysisData.summary?.validCount || 0}</div>
                          <p className="text-muted-foreground">Valid Units</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{analysisData.summary?.expiredCount || 0}</div>
                          <p className="text-muted-foreground">Expired Units</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{analysisData.summary?.expiringSoonCount || 0}</div>
                          <p className="text-muted-foreground">Expiring Soon</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Summary Table */}
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Count</TableHead>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Total Amount (ml)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysisData.summary?.byType?.map((item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{item.type}</TableCell>
                              <TableCell>{item.count}</TableCell>
                              <TableCell>{(item.percentage * 100).toFixed(1)}%</TableCell>
                              <TableCell>{item.totalAmount} ml</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Visual Representation Placeholder */}
                    <div className="border rounded-md p-6 flex items-center justify-center bg-slate-50">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">
                          Visual representation of data would appear here in a production environment
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="byBloodType">
                  <div className="space-y-6">
                    {/* Blood Type Distribution Table */}
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Blood Type</TableHead>
                            <TableHead>Count</TableHead>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Total Amount (ml)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysisData.byBloodType?.map((item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Badge className={getBloodTypeColor(item.bloodType, item.rh)}>
                                  {formatBloodType(item.bloodType, item.rh)}
                                </Badge>
                              </TableCell>
                              <TableCell>{item.count}</TableCell>
                              <TableCell>{(item.percentage * 100).toFixed(1)}%</TableCell>
                              <TableCell>{item.totalAmount} ml</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Visual Representation Placeholder */}
                    <div className="border rounded-md p-6 flex items-center justify-center bg-slate-50">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">
                          Blood type distribution chart would appear here in a production environment
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="byExpiration">
                  <div className="space-y-6">
                    {/* Expiration Distribution Table */}
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Expiration Status</TableHead>
                            <TableHead>Count</TableHead>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Total Amount (ml)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysisData.byExpiration?.map((item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    item.status === "Expired"
                                      ? "bg-red-100 text-red-800"
                                      : item.status === "Expiring Soon"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </TableCell>
                              <TableCell>{item.count}</TableCell>
                              <TableCell>{(item.percentage * 100).toFixed(1)}%</TableCell>
                              <TableCell>{item.totalAmount} ml</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Expiration Timeline */}
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">Expiration Timeline</h3>
                      <div className="space-y-2">
                        {analysisData.expirationTimeline?.map((item: any, index: number) => (
                          <div key={index} className="flex items-center">
                            <div className="w-24 text-sm">{item.period}</div>
                            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${item.percentage * 100}%` }}></div>
                            </div>
                            <div className="w-16 text-right text-sm">{item.count} units</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="byHospital">
                  <div className="space-y-6">
                    {/* Hospital Distribution Table */}
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Hospital</TableHead>
                            <TableHead>Count</TableHead>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Total Amount (ml)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysisData.byHospital?.map((item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{item.hospitalName}</TableCell>
                              <TableCell>{item.count}</TableCell>
                              <TableCell>{(item.percentage * 100).toFixed(1)}%</TableCell>
                              <TableCell>{item.totalAmount} ml</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
