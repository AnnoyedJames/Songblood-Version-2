"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InventoryTable from "./inventory-table"
import AddInventoryForm from "./add-inventory-form"
import { Card } from "@/components/ui/card"
import { BoneIcon as Blood, Droplets, FlaskConical } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

type InventoryItem = {
  bag_id?: number
  blood_type: string
  rh?: string
  count: number
  total_amount: number
  donor_name?: string
  expiration_date?: string
}

type InventoryManagerProps = {
  hospitalId: number
  redBlood: InventoryItem[]
  plasma: InventoryItem[]
  platelets: InventoryItem[]
}

export default function InventoryManager({ hospitalId, redBlood, plasma, platelets }: InventoryManagerProps) {
  const [activeTab, setActiveTab] = useState("redblood")
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // State to track inventory (initial data from props)
  const [redBloodInventory, setRedBloodInventory] = useState(redBlood)
  const [plasmaInventory, setPlasmaInventory] = useState(plasma)
  const [plateletsInventory, setPlateletsInventory] = useState(platelets)

  // Handle inventory updates
  const handleInventoryUpdate = (type: string, updatedInventory: InventoryItem[]) => {
    if (type === "redblood") {
      setRedBloodInventory(updatedInventory)
    } else if (type === "plasma") {
      setPlasmaInventory(updatedInventory)
    } else if (type === "platelets") {
      setPlateletsInventory(updatedInventory)
    }
  }

  // Show alert message
  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message })
    // Auto-dismiss after 5 seconds
    setTimeout(() => setAlert(null), 5000)
  }

  return (
    <div className="space-y-6">
      {alert && (
        <Alert variant={alert.type === "success" ? "default" : "destructive"}>
          {alert.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{alert.type === "success" ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="redblood" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="redblood" className="flex items-center space-x-2">
            <Blood className="h-4 w-4" />
            <span>Red Blood Cells</span>
          </TabsTrigger>
          <TabsTrigger value="plasma" className="flex items-center space-x-2">
            <Droplets className="h-4 w-4" />
            <span>Plasma</span>
          </TabsTrigger>
          <TabsTrigger value="platelets" className="flex items-center space-x-2">
            <FlaskConical className="h-4 w-4" />
            <span>Platelets</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="p-0 overflow-hidden">
            <TabsContent value="redblood" className="m-0">
              <InventoryTable
                type="redblood"
                title="Red Blood Cell Inventory"
                inventory={redBloodInventory}
                hospitalId={hospitalId}
                onUpdate={(updatedInventory) => handleInventoryUpdate("redblood", updatedInventory)}
                onShowAlert={showAlert}
              />
            </TabsContent>
            <TabsContent value="plasma" className="m-0">
              <InventoryTable
                type="plasma"
                title="Plasma Inventory"
                inventory={plasmaInventory}
                hospitalId={hospitalId}
                onUpdate={(updatedInventory) => handleInventoryUpdate("plasma", updatedInventory)}
                onShowAlert={showAlert}
              />
            </TabsContent>
            <TabsContent value="platelets" className="m-0">
              <InventoryTable
                type="platelets"
                title="Platelets Inventory"
                inventory={plateletsInventory}
                hospitalId={hospitalId}
                onUpdate={(updatedInventory) => handleInventoryUpdate("platelets", updatedInventory)}
                onShowAlert={showAlert}
              />
            </TabsContent>
          </Card>

          <Card>
            <TabsContent value="redblood" className="mt-0">
              <AddInventoryForm
                type="redblood"
                hospitalId={hospitalId}
                onSuccess={(newItem) => {
                  handleInventoryUpdate("redblood", [...redBloodInventory, newItem])
                  showAlert("success", "Successfully added red blood cell entry")
                }}
                onError={(message) => showAlert("error", message)}
              />
            </TabsContent>
            <TabsContent value="plasma" className="mt-0">
              <AddInventoryForm
                type="plasma"
                hospitalId={hospitalId}
                onSuccess={(newItem) => {
                  handleInventoryUpdate("plasma", [...plasmaInventory, newItem])
                  showAlert("success", "Successfully added plasma entry")
                }}
                onError={(message) => showAlert("error", message)}
              />
            </TabsContent>
            <TabsContent value="platelets" className="mt-0">
              <AddInventoryForm
                type="platelets"
                hospitalId={hospitalId}
                onSuccess={(newItem) => {
                  handleInventoryUpdate("platelets", [...plateletsInventory, newItem])
                  showAlert("success", "Successfully added platelets entry")
                }}
                onError={(message) => showAlert("error", message)}
              />
            </TabsContent>
          </Card>
        </div>
      </Tabs>
    </div>
  )
}
