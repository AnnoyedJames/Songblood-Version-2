"use client"

import { useState, useEffect } from "react"
import { AlertCircle, X } from "lucide-react"
import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type InventoryItem = {
  blood_type: string
  rh?: string
  count: number
  total_amount: number
  type: string
}

type CriticalInventoryNotificationProps = {
  inventory: InventoryItem[]
}

export default function CriticalInventoryNotification({ inventory }: CriticalInventoryNotificationProps) {
  const [dismissed, setDismissed] = useState(false)
  const [criticalItems, setCriticalItems] = useState<InventoryItem[]>([])

  useEffect(() => {
    // Filter for critical items (below 200 ml)
    const critical = inventory.filter((item) => Number(item.total_amount) < 200)
    setCriticalItems(critical)
  }, [inventory])

  if (dismissed || criticalItems.length === 0) {
    return null
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded-r-md shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Critical Inventory Alert</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>The following blood components are at critically low levels:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              {criticalItems.map((item, index) => (
                <li key={index}>
                  <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                    {formatBloodType(item.blood_type, item.rh)}
                  </Badge>{" "}
                  {item.type}: {Number(item.total_amount).toLocaleString()} ml ({item.count} units)
                </li>
              ))}
            </ul>
            <p className="mt-2 font-medium">Please take immediate action to replenish these supplies.</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-auto flex-shrink-0 text-red-500 hover:text-red-700 focus:outline-none"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
