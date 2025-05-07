import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertTriangle, Database } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Database Status | Blood Bank",
  description: "Database connection status and diagnostics",
}

export default async function DatabaseStatusPage() {
  const statusResults = await checkDatabaseStatus()

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Database Status</h1>
          <Button asChild variant="outline">
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription>Current status of the database connection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusResults.connection.success ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Connected</AlertTitle>
                  <AlertDescription>
                    Successfully connected to the database. Server time: {statusResults.connection.serverTime}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Connection Failed</AlertTitle>
                  <AlertDescription>
                    {statusResults.connection.error || "Could not connect to the database."}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium mb-2">Tables</h3>
                  <ul className="space-y-2">
                    {Object.entries(statusResults.tables).map(([tableName, status]) => (
                      <li key={tableName} className="flex items-center text-sm">
                        {status.exists ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                        )}
                        <span className="mr-2">{tableName}:</span>
                        {status.exists ? (
                          <span className="text-green-600">
                            {status.count !== undefined ? `${status.count} records` : "Exists"}
                          </span>
                        ) : (
                          <span className="text-red-600">Missing</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Environment</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <span className="mr-2">NODE_ENV:</span>
                      <code className="bg-gray-100 px-1 py-0.5 rounded">{process.env.NODE_ENV}</code>
                    </li>
                    <li className="flex items-center text-sm">
                      <span className="mr-2">Database URL:</span>
                      {process.env.DATABASE_URL ? (
                        <span className="text-green-600">Set</span>
                      ) : (
                        <span className="text-red-600">Not set</span>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {statusResults.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                Recommendations
              </CardTitle>
              <CardDescription>Actions to resolve database issues</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {statusResults.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-amber-100 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

async function checkDatabaseStatus() {
  const results = {
    connection: {
      success: false,
      serverTime: null as string | null,
      error: null as string | null,
    },
    tables: {
      admins: { exists: false, count: 0 },
      admin_sessions: { exists: false, count: 0 },
      hospitals: { exists: false, count: 0 },
      redblood_inventory: { exists: false, count: 0 },
      plasma_inventory: { exists: false, count: 0 },
      platelets_inventory: { exists: false, count: 0 },
    },
    recommendations: [] as string[],
  }

  try {
    // Test basic connection
    const connectionTest = await sql(`SELECT NOW() as server_time`)
    results.connection.success = true
    results.connection.serverTime = new Date(connectionTest[0].server_time).toLocaleString()
  } catch (error) {
    results.connection.success = false
    results.connection.error = error instanceof Error ? error.message : "Unknown error"
    results.recommendations.push(
      "Check that the DATABASE_URL environment variable is correctly set and the database is accessible.",
    )
    return results
  }

  // Check each table
  for (const tableName of Object.keys(results.tables)) {
    try {
      const tableCheck = await sql(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists
      `,
        tableName,
      )

      results.tables[tableName as keyof typeof results.tables].exists = tableCheck[0].exists

      if (tableCheck[0].exists) {
        const countCheck = await sql(`SELECT COUNT(*) as count FROM ${tableName}`)
        results.tables[tableName as keyof typeof results.tables].count = Number.parseInt(countCheck[0].count)
      }
    } catch (error) {
      console.error(`Error checking table ${tableName}:`, error)
    }
  }

  // Generate recommendations
  if (!results.tables.admins.exists) {
    results.recommendations.push("The 'admins' table is missing. Run the database initialization script to create it.")
  } else if (results.tables.admins.count === 0) {
    results.recommendations.push("The 'admins' table exists but has no records. Create at least one admin user.")
  }

  if (!results.tables.hospitals.exists) {
    results.recommendations.push(
      "The 'hospitals' table is missing. Run the database initialization script to create it.",
    )
  } else if (results.tables.hospitals.count === 0) {
    results.recommendations.push("The 'hospitals' table exists but has no records. Create at least one hospital.")
  }

  return results
}
