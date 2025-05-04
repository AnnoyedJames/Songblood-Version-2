import { AlertCircle, AlertTriangle, Check } from "lucide-react"

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
  className?: string
}

type WarningItem = {
  type: "redblood" | "plasma" | "platelets"
  blood_type: string
  rh?: string
  count: number
  total_amount: number
  status: "critical" | "low"
}

export default function BloodInventoryWarnings({
  redBlood,
  plasma,
  platelets,
  className = "",
}: BloodInventoryWarningsProps) {
  // Process all inventory items to find warnings
  const warnings: WarningItem[] = []

  // Check red blood cells
  redBlood.forEach((item) => {
    if (item.total_amount < 500) {
      warnings.push({
        type: "redblood",
        blood_type: item.blood_type,
        rh: item.rh,
        count: item.count,
        total_amount: item.total_amount,
        status: "critical",
      })
    } else if (item.total_amount < 1500) {
      warnings.push({
        type: "redblood",
        blood_type: item.blood_type,
        rh: item.rh,
        count: item.count,
        total_amount: item.total_amount,
        status: "low",
      })
    }
  })

  // Check plasma
  plasma.forEach((item) => {
    if (item.total_amount < 500) {
      warnings.push({
        type: "plasma",
        blood_type: item.blood_type,
        count: item.count,
        total_amount: item.total_amount,
        status: "critical",
      })
    } else if (item.total_amount < 1500) {
      warnings.push({
        type: "plasma",
        blood_type: item.blood_type,
        count: item.count,
        total_amount: item.total_amount,
        status: "low",
      })
    }
  })

  // Check platelets
  platelets.forEach((item) => {
    if (item.total_amount < 500) {
      warnings.push({
        type: "platelets",
        blood_type: item.blood_type,
        rh: item.rh,
        count: item.count,
        total_amount: item.total_amount,
        status: "critical",
      })
    } else if (item.total_amount < 1500) {
      warnings.push({
        type: "platelets",
        blood_type: item.blood_type,
        rh: item.rh,
        count: item.count,
        total_amount: item.total_amount,
        status: "low",
      })
    }
  })

  // Sort warnings by status (critical first) and then by blood type
  warnings.sort((a, b) => {
    if (a.status === "critical" && b.status !== "critical") return -1
    if (a.status !== "critical" && b.status === "critical") return 1
    return `${a.blood_type}${a.rh || ""}`.localeCompare(`${b.blood_type}${b.rh || ""}`)
  })

  // Helper function to get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
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

  // Helper function to get blood type badge color
  const getBloodTypeColor = (bloodType: string) => {
    switch (bloodType) {
      case "A":
        return "bg-green-100 text-green-800"
      case "B":
        return "bg-blue-100 text-blue-800"
      case "AB":
        return "bg-purple-100 text-purple-800"
      case "O":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h2 className="text-lg font-medium mb-3">Inventory Warnings</h2>

      {warnings.length === 0 ? (
        <div className="flex items-center p-3 bg-green-50 text-green-700 rounded-md">
          <Check className="h-5 w-5 mr-2" />
          <span>All blood types at adequate levels</span>
        </div>
      ) : (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <div
              key={index}
              className={`flex items-center p-3 rounded-md ${
                warning.status === "critical" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {warning.status === "critical" ? (
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              )}

              <div className="flex-1">
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${getBloodTypeColor(
                      warning.blood_type,
                    )}`}
                  >
                    {warning.blood_type}
                    {warning.rh !== undefined ? warning.rh : ""}
                  </span>
                  <span className="font-medium">{getTypeLabel(warning.type)}</span>
                </div>
                <div className="text-sm mt-1">
                  <span className="font-bold">{warning.total_amount.toLocaleString()} ml</span>
                  <span className="mx-1">•</span>
                  <span>{warning.count} units</span>
                  <span className="ml-2 text-xs uppercase font-semibold">
                    {warning.status === "critical" ? "CRITICAL" : "LOW"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
