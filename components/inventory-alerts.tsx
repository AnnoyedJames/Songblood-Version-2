import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, AlertCircle } from "lucide-react"

type InventoryItem = {
  blood_type: string
  rh?: string
  count: number
  total_amount: number
  type: string
}

type InventoryAlertsProps = {
  inventory: InventoryItem[]
}

export default function InventoryAlerts({ inventory }: InventoryAlertsProps) {
  // Filter inventory items below thresholds
  const warningItems = inventory.filter((item) => Number(item.total_amount) < 400 && Number(item.total_amount) >= 200)
  const criticalItems = inventory.filter((item) => Number(item.total_amount) < 200)

  // If no alerts, return a message
  if (warningItems.length === 0 && criticalItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Alerts</CardTitle>
          <CardDescription>Monitoring blood component inventory levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4 text-muted-foreground">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
              </div>
              <p>All inventory levels are sufficient.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Inventory Alerts</CardTitle>
        <CardDescription>Monitoring blood component inventory levels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {criticalItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-red-700 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Critical Inventory Levels
              </h3>
              {criticalItems.map((item, index) => (
                <div key={`critical-${index}`} className="flex items-start gap-3 p-3 border rounded-lg bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-medium">
                      <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                        {formatBloodType(item.blood_type, item.rh)}
                      </Badge>{" "}
                      {item.type} is critically low
                    </div>
                    <div className="text-sm text-red-700">
                      Current amount: <span className="font-bold">{Number(item.total_amount).toLocaleString()} ml</span>{" "}
                      ({Number(item.count).toLocaleString()} units)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {warningItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Low Inventory Levels
              </h3>
              {warningItems.map((item, index) => (
                <div key={`warning-${index}`} className="flex items-start gap-3 p-3 border rounded-lg bg-amber-50">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <div className="font-medium">
                      <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                        {formatBloodType(item.blood_type, item.rh)}
                      </Badge>{" "}
                      {item.type} is running low
                    </div>
                    <div className="text-sm text-amber-700">
                      Current amount: <span className="font-bold">{Number(item.total_amount).toLocaleString()} ml</span>{" "}
                      ({Number(item.count).toLocaleString()} units)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
