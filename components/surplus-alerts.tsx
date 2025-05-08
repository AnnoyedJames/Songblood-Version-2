"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

type SurplusAlert = {
  id: number
  hospital_id: number
  blood_type: string
  rh_factor?: string
  product_type: string
  amount: number
  created_at: string
  hospital_name?: string
}

type SurplusAlertsProps = {
  alerts: SurplusAlert[]
  className?: string
}

export default function SurplusAlerts({ alerts = [], className = "" }: SurplusAlertsProps) {
  const [expanded, setExpanded] = useState(false)
  
  // Ensure alerts is an array
  const safeAlerts = Array.isArray(alerts) ? alerts : []
  
  // If no alerts, don't render anything
  if (safeAlerts.length === 0) {
    return null
  }

  // Sort alerts by date (newest first)
  const sortedAlerts = [...safeAlerts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Limit to 3 alerts when not expanded
  const displayedAlerts = expanded ? sortedAlerts : sortedAlerts.slice(0, 3)

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Get product type label
  const getProductTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "redblood":
        return "Red Blood Cells"
      case "plasma":
        return "Plasma"
      case "platelets":
        return "Platelets"
      default:
        return type
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
          Surplus Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedAlerts.map((alert) => (
            <div key={alert.id} className="p-3 bg-amber-50 rounded-md border border-amber-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {getProductTypeLabel(alert.product_type)} - {alert.blood_type}
                    {alert.rh_factor !== undefined ? alert.rh_factor : ""}
                  </p>
                  <p className="text-sm text-amber-700">
                    {alert.amount.toLocaleString()} ml surplus reported on {formatDate(alert.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {sortedAlerts.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" /> Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" /> Show {sortedAlerts.length - 3} More
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
