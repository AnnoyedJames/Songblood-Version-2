import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function InventoryTable({ title, inventory = [], showRh = false }: InventoryTableProps) {
  // Ensure inventory is an array
  const safeInventory = Array.isArray(inventory) ? inventory : []

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Blood Type</TableHead>
              {showRh && <TableHead>Rh Factor</TableHead>}
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Amount (ml)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showRh ? 4 : 3} className="text-center text-muted-foreground">
                  No inventory data available
                </TableCell>
              </TableRow>
            ) : (
              safeInventory.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.blood_type}</TableCell>
                  {showRh && <TableCell>{item.rh || ""}</TableCell>}
                  <TableCell className="text-right">{item.count}</TableCell>
                  <TableCell className="text-right">{item.total_amount.toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
