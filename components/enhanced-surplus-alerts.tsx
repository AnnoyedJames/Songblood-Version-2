"use client"

import { useEffect, useState } from "react"
import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ExternalLink, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import type { SurplusItem } from "@/lib/surplus-utils"

type EnhancedSurplusAlertsProps = {
  initialAlerts: SurplusItem[]
  hospitalId: number
  refreshInterval?: number
  className?: string
}

export default function EnhancedSurplusAlerts({
  initialAlerts,
  hospitalId,
  refreshInterval = 60000, // Default to 1 minute
  className = "",
}: EnhancedSurplusAlertsProps) {
  const [alerts, setAlerts] = useState<SurplusItem[]>(initialAlerts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/surplus/alerts?hospitalId=${hospitalId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch surplus alerts")
        }

        const data = await response.json()
        setAlerts(data)
      } catch (err) {
        console.error("Error fetching surplus alerts:", err)
        setError("Failed to refresh surplus alerts")
      } finally {
        setLoading(false)
      }
    }

    // Set up interval for periodic updates
    const intervalId = setInterval(fetchAlerts, refreshInterval)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [hospitalId, refreshInterval])

  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Surplus Alerts</CardTitle>
          <CardDescription>Hospitals with surplus blood components that you need</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4 text-muted-foreground">
            No alerts at this time. Your inventory levels are sufficient.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="relative">
        <CardTitle className="text-lg">Surplus Alerts</CardTitle>
        <CardDescription>Hospitals with surplus blood components that you need</CardDescription>
        {loading && (
          <div className="absolute top-4 right-4">
            <div className="animate-pulse h-2 w-2 rounded-full bg-blue-500"></div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && <div className="p-3 text-sm border rounded-lg bg-red-50 text-red-700 mb-4">{error}</div>}

          {alerts.map((alert, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">
                  {alert.hospitalName} has <span className="font-bold">{alert.count} units</span> of{" "}
                  <Badge className={getBloodTypeColor(alert.bloodType, alert.rh)}>
                    {formatBloodType(alert.bloodType, alert.rh)}
                  </Badge>{" "}
                  {alert.type}
                </div>
                <div className="text-sm text-muted-foreground">
                  You currently have {alert.yourCount} units (
                  {alert.surplusLevel === "critical-low" ? (
                    <span className="text-red-600 font-semibold">CRITICAL</span>
                  ) : (
                    <span className="text-amber-600 font-semibold">LOW</span>
                  )}
                  )
                </div>
                <div className="flex gap-2 mt-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7">
                          <PhoneCall className="h-3.5 w-3.5 mr-1" />
                          Contact Hospital
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Contact this hospital for information</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Link
                    href={`/surplus/details?hospital=${alert.hospitalId}&type=${alert.type}&bloodType=${alert.bloodType}&rh=${alert.rh}`}
                  >
                    <Button variant="ghost" size="sm" className="h-7">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
