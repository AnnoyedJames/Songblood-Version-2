"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DataTable from "./data-table"

type ViewDataTabsProps = {
  hospitalId: number
}

export default function ViewDataTabs({ hospitalId }: ViewDataTabsProps) {
  const [activeTab, setActiveTab] = useState("active")

  return (
    <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="active">Active Data</TabsTrigger>
          <TabsTrigger value="inactive">Recover Data</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="active" className="mt-0">
        <DataTable showInactive={false} hospitalId={hospitalId} />
      </TabsContent>

      <TabsContent value="inactive" className="mt-0">
        <DataTable showInactive={true} hospitalId={hospitalId} />
      </TabsContent>
    </Tabs>
  )
}
