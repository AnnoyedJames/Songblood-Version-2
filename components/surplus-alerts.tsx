import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Droplets } from "lucide-react"

type SurplusAlert = {
  id: number
  hospital_name: string
  blood_type: string
  amount: number
  created_at: string
  status: string
}

interface SurplusAlertsProps {
  alerts: SurplusAlert[]
}

export default function SurplusAlerts({ alerts = [] }: SurplusAlertsProps) {
  // Ensure alerts is always an array
  const safeAlerts = Array.isArray(alerts) ? alerts : []

  if (safeAlerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Droplets className="h-8 w-8 mb-2 text-green-500" />
            <p>No surplus alerts at this time</p>
            <p className="text-xs mt-1">All blood supplies are balanced</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {safeAlerts.map((alert) => (
            <div
              key={alert?.id || Math.random()}
              className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <div>
                <div className="font-medium">{alert?.hospital_name || "Unknown Hospital"}</div>
                <div className="text-sm text-muted-foreground">
                  {alert?.blood_type || "Unknown"} • {alert?.amount || 0} units
                </div>
              </div>
              <Badge variant={alert?.status === "urgent" ? "destructive" : "outline"}>
                {alert?.status === "urgent" ? "Urgent" : "Available"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
