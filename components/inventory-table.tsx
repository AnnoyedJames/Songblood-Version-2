import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type InventoryItem = {
  blood_type: string
  rh?: string
  count: number
  total_amount: number
}

type InventoryTableProps = {
  title: string
  inventory: InventoryItem[]
  showRh?: boolean
}

export default function InventoryTable({ title, inventory, showRh = true }: InventoryTableProps) {
  // Ensure inventory data is valid
  const validInventory = inventory.filter(
    (item) =>
      item &&
      item.blood_type &&
      (typeof item.count === "number" || typeof item.count === "string") &&
      (typeof item.total_amount === "number" || typeof item.total_amount === "string"),
  )

  // Sort inventory by blood type (A, B, AB, O) and then by Rh factor (+ then -)
  const sortedInventory = [...validInventory].sort((a, b) => {
    // First sort by blood type
    if (a.blood_type !== b.blood_type) {
      // Custom sort order: O, A, B, AB
      const typeOrder = { O: 1, A: 2, B: 3, AB: 4 }
      return (
        (typeOrder[a.blood_type as keyof typeof typeOrder] || 99) -
        (typeOrder[b.blood_type as keyof typeof typeOrder] || 99)
      )
    }

    // Then sort by Rh factor if blood types are the same
    if (showRh && a.rh && b.rh) {
      // + comes before -
      return a.rh === "+" ? -1 : 1
    }

    return 0
  })

  // Calculate total units and amount
  const totalUnits = sortedInventory.reduce((sum, item) => sum + Number(item.count || 0), 0)
  const totalAmount = sortedInventory.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="text-sm text-muted-foreground">
          Total: {totalUnits} units ({totalAmount.toLocaleString()} ml)
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Blood Type</TableHead>
            <TableHead className="text-right">Units</TableHead>
            <TableHead className="text-right">Total Amount (ml)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInventory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No inventory data available
              </TableCell>
            </TableRow>
          ) : (
            sortedInventory.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                    {formatBloodType(item.blood_type, showRh ? item.rh : undefined)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{Number(item.count).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(item.total_amount).toLocaleString()} ml</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
