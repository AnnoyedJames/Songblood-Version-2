import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

type SurplusAlert = {
  type: string
  bloodType: string
  rh: string
  hospitalName: string
  hospitalId: number
  count: number
  yourCount: number
  contactPhone?: string
  contactEmail?: string
}

type SurplusAlertsProps = {
  alerts: SurplusAlert[]
}

export default function SurplusAlerts({ alerts }: SurplusAlertsProps) {
  if (alerts.length === 0) {
    return (
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Surplus Alerts</CardTitle>
        <CardDescription>Hospitals with surplus blood components that you need</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <div className="font-medium">
                  {alert.hospitalName} has <span className="font-bold">{alert.count} units</span> of{" "}
                  <Badge className={getBloodTypeColor(alert.bloodType, alert.rh)}>
                    {formatBloodType(alert.bloodType, alert.rh)}
                  </Badge>{" "}
                  {alert.type}
                </div>
                <div className="text-sm text-muted-foreground">You currently have {alert.yourCount} units</div>
                {(alert.contactPhone || alert.contactEmail) && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Contact: {alert.contactPhone && <span className="mr-2">{alert.contactPhone}</span>}
                    {alert.contactEmail && <span>{alert.contactEmail}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
