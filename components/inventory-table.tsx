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

export default function InventoryTable({ title, inventory, showRh = false }: InventoryTableProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">{title}</h3>
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
          {inventory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No inventory data available
              </TableCell>
            </TableRow>
          ) : (
            inventory.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Badge className={getBloodTypeColor(item.blood_type, item.rh)}>
                    {formatBloodType(item.blood_type, showRh ? item.rh : undefined)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{item.count}</TableCell>
                <TableCell className="text-right">{item.total_amount} ml</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
