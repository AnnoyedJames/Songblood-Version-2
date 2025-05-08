"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DebugDataDisplay() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch("/api/diagnostics/data-structure")
        if (!response.ok) {
          throw new Error("Failed to fetch data structure")
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div>Loading data structure...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!data) {
    return <div>No data available</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Structure Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="redBlood">
          <TabsList>
            <TabsTrigger value="redBlood">Red Blood</TabsTrigger>
            <TabsTrigger value="plasma">Plasma</TabsTrigger>
            <TabsTrigger value="platelets">Platelets</TabsTrigger>
          </TabsList>
          <TabsContent value="redBlood">
            <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(data.redBlood, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent value="plasma">
            <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(data.plasma, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent value="platelets">
            <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(data.platelets, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
