import { Suspense } from "react"
import DataDiagnostics from "@/components/data-diagnostics"
import DbConnectionStatus from "@/components/db-connection-status"
import RunMigrationButton from "@/components/run-migration-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DiagnosticsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">System Diagnostics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
            <CardDescription>Current status of database connection</CardDescription>
          </CardHeader>
          <CardContent>
            <DbConnectionStatus />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Migrations</CardTitle>
            <CardDescription>Run database migrations</CardDescription>
          </CardHeader>
          <CardContent>
            <RunMigrationButton />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Data Diagnostics</CardTitle>
            <CardDescription>View and fix data inconsistencies</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading data diagnostics...</div>}>
              <DataDiagnostics />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
