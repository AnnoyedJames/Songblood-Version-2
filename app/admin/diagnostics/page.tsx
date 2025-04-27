import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Header from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getConnectionStatus, checkDatabaseConnection } from "@/lib/db-connection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Database, AlertTriangle, CheckCircle } from "lucide-react"

export default async function DiagnosticsPage() {
  try {
    const session = await requireAuth()

    // If no session, redirect to login
    if (!session) {
      redirect("/login?reason=no-session")
    }

    const { hospitalId } = session

    // Check database connection
    const isConnected = await checkDatabaseConnection()
    const connectionStatus = getConnectionStatus()

    // Get environment variables (sanitized)
    const dbUrl = process.env.DATABASE_URL || "Not set"
    const sanitizedDbUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, "//[username]:[password]@")

    return (
      <div className="min-h-screen flex flex-col">
        <Header hospitalId={hospitalId} hospitalName="System Diagnostics" />

        <main className="flex-1 container py-6 px-4 md:py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Database Diagnostics</h1>
            <form action="/admin/diagnostics" method="GET">
              <Button type="submit" variant="outline" size="sm" className="gap-1">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </form>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Connection Status
                </CardTitle>
                <CardDescription>Current status of the Neon database connection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Connection Status:</span>
                    <Badge variant={isConnected ? "outline" : "destructive"}>
                      {isConnected ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Disconnected
                        </span>
                      )}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Last Checked:</span>
                    <span>{new Date(connectionStatus.lastChecked).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Last Connection Attempt:</span>
                    <span>{new Date(connectionStatus.lastConnectionAttempt).toLocaleString()}</span>
                  </div>

                  {connectionStatus.error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <h3 className="text-sm font-medium text-red-800 mb-1">Last Error:</h3>
                      <p className="text-xs text-red-700 break-all">{connectionStatus.error.message}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Configuration</CardTitle>
                <CardDescription>Database connection configuration details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Database URL:</h3>
                    <p className="text-xs bg-gray-50 p-2 rounded border break-all">{sanitizedDbUrl}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Connection Settings:</h3>
                    <ul className="text-xs space-y-1">
                      <li>
                        <span className="font-medium">Retry Count:</span> 5
                      </li>
                      <li>
                        <span className="font-medium">Retry Timeout:</span> 10000ms
                      </li>
                      <li>
                        <span className="font-medium">WebSocket Timeout:</span> 30000ms
                      </li>
                      <li>
                        <span className="font-medium">Connection Cache:</span> Enabled
                      </li>
                    </ul>
                  </div>

                  <div className="text-xs text-muted-foreground mt-4">
                    <p>
                      If you're experiencing connection issues, please check that your DATABASE_URL environment variable
                      is correctly set and that your database is running.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error("Diagnostics page error:", error)

    // If the error is a redirect, let it happen
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }

    // Return a simple error message
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-xl font-bold mb-4">Error Loading Diagnostics</h1>
          <p className="mb-4">There was an error loading the diagnostics page. Please try logging in again.</p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }
}
