import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { AlertTriangle, AlertCircle } from "lucide-react"

type InventoryItem = {
  blood_type: string
  rh?: string
  count: number
  total_amount: number
}

type BloodInventoryWarningsProps = {
  redBlood: InventoryItem[]
  plasma: InventoryItem[]
  platelets: InventoryItem[]
}

export default function BloodInventoryWarnings({ redBlood, plasma, platelets }: BloodInventoryWarningsProps) {
  // Combine all inventory items
  const allInventory = [
    ...redBlood.map((item) => ({ ...item, type: "Red Blood Cells" })),
    ...plasma.map((item) => ({ ...item, type: "Plasma" })),
    ...platelets.map((item) => ({ ...item, type: "Platelets" })),
  ]

  // Filter for low and critical levels
  const criticalItems = allInventory.filter((item) => item.total_amount < 500)
  const lowItems = allInventory.filter((item) => item.total_amount >= 500 && item.total_amount < 1500)

  // If no warnings, show a message
  if (criticalItems.length === 0 && lowItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Warnings</CardTitle>
          <CardDescription>Blood types with low or critical supply levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4 text-muted-foreground">
            All blood types are at adequate supply levels.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Inventory Warnings</CardTitle>
        <CardDescription>Blood types with low or critical supply levels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {criticalItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Critical Supply
              </h3>
              <div className="grid gap-2">
                {criticalItems.map((item, index) => (
                  <div
                    key={`critical-${index}`}
                    className="flex items-center justify-between p-2 border rounded-md bg-red-50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                        {formatBloodType(item.blood_type, item.rh)}
                      </Badge>
                      <span className="font-medium">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-red-600 font-bold">{item.total_amount.toLocaleString()} ml</span>
                      <div className="text-xs text-muted-foreground">{item.count} units</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Low Supply
              </h3>
              <div className="grid gap-2">
                {lowItems.map((item, index) => (
                  <div
                    key={`low-${index}`}
                    className="flex items-center justify-between p-2 border rounded-md bg-amber-50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                        {formatBloodType(item.blood_type, item.rh)}
                      </Badge>
                      <span className="font-medium">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-600 font-bold">{item.total_amount.toLocaleString()} ml</span>
                      <div className="text-xs text-muted-foreground">{item.count} units</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
