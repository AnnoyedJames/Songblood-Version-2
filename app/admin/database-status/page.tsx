import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Database } from "lucide-react"
import { sql } from "@/lib/db"

export const metadata = {
  title: "Database Status | Blood Bank",
  description: "Database connection status and diagnostics",
}

export default async function DatabaseStatusPage() {
  let dbStatus = { success: false, error: null, tables: {} }

  try {
    // Check database connection
    const connectionTest = await sql`SELECT NOW() as server_time`

    // Check tables
    const tables = {
      admins: await checkTable("admins"),
      admin_sessions: await checkTable("admin_sessions"),
      hospitals: await checkTable("hospitals"),
    }

    dbStatus = {
      success: true,
      error: null,
      tables,
      serverTime: connectionTest[0].server_time,
    }
  } catch (error) {
    dbStatus = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      tables: {},
    }
  }

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
            {dbStatus.success ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Connected</AlertTitle>
                <AlertDescription>
                  Successfully connected to the database. Server time: {new Date(dbStatus.serverTime).toLocaleString()}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>{dbStatus.error || "Could not connect to the database."}</AlertDescription>
              </Alert>
            )}

            {dbStatus.success && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {Object.entries(dbStatus.tables).map(([tableName, tableInfo]: [string, any]) => (
                  <Card key={tableName}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center">
                        {tableInfo.exists ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        )}
                        {tableName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      {tableInfo.exists ? (
                        <p className="text-sm text-green-600">{tableInfo.count} records</p>
                      ) : (
                        <p className="text-sm text-red-600">Table does not exist</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function checkTable(tableName: string) {
  try {
    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ) as exists
    `

    if (!tableExists[0].exists) {
      return { exists: false }
    }

    // Get count
    const countResult = await sql`
      SELECT COUNT(*) as count FROM ${tableName}
    `

    return {
      exists: true,
      count: Number.parseInt(countResult[0].count),
    }
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
