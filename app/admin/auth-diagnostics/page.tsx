"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CheckCircle2, XCircle, Database, User, Key } from "lucide-react"
import Link from "next/link"

export default function AuthDiagnosticsPage() {
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [adminStatus, setAdminStatus] = useState<any>(null)
  const [initStatus, setInitStatus] = useState<any>(null)
  const [initLoading, setInitLoading] = useState(false)

  useEffect(() => {
    async function checkStatus() {
      setLoading(true)
      try {
        // Check database connection
        const dbResponse = await fetch("/api/admin/check-admins")
        const dbData = await dbResponse.json()
        setDbStatus(dbData)
      } catch (error) {
        setDbStatus({ error: error instanceof Error ? error.message : "Unknown error" })
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [])

  const handleInitTestAdmin = async () => {
    setInitLoading(true)
    try {
      const response = await fetch("/api/admin/init-test-admin", {
        method: "POST",
      })
      const data = await response.json()
      setInitStatus(data)

      // Refresh admin status
      const dbResponse = await fetch("/api/admin/check-admins")
      const dbData = await dbResponse.json()
      setDbStatus(dbData)
    } catch (error) {
      setInitStatus({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setInitLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Authentication Diagnostics</h1>
          <Button asChild variant="outline">
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">System Status</TabsTrigger>
            <TabsTrigger value="tools">Diagnostic Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Database Status
                </CardTitle>
                <CardDescription>Current status of the authentication database</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : dbStatus?.error ? (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Database Error</AlertTitle>
                    <AlertDescription>{dbStatus.error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <Alert
                      className={dbStatus?.exists ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}
                    >
                      {dbStatus?.exists ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-amber-600" />
                      )}
                      <AlertTitle className={dbStatus?.exists ? "text-green-600" : "text-amber-600"}>
                        {dbStatus?.exists ? "Admins Table Exists" : "Admins Table Missing"}
                      </AlertTitle>
                      <AlertDescription>
                        {dbStatus?.exists
                          ? `Found ${dbStatus.count} admin accounts in the database.`
                          : "The admins table does not exist. You need to initialize the database."}
                      </AlertDescription>
                    </Alert>

                    {dbStatus?.exists && dbStatus?.admins && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Admin Accounts:</h3>
                        <div className="bg-gray-50 p-3 rounded border overflow-auto max-h-60">
                          <pre className="text-xs">{JSON.stringify(dbStatus.admins, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleInitTestAdmin} disabled={initLoading} className="w-full">
                  {initLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Initialize Test Admin
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {initStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>Initialization Result</CardTitle>
                </CardHeader>
                <CardContent>
                  {initStatus.error ? (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{initStatus.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-600">Success</AlertTitle>
                      <AlertDescription>
                        {initStatus.message}. Created {initStatus.hospitals} hospitals and {initStatus.admins} admins.
                      </AlertDescription>
                    </Alert>
                  )}

                  {initStatus.adminDetails && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Admin Details:</h3>
                      <div className="bg-gray-50 p-3 rounded border overflow-auto max-h-60">
                        <pre className="text-xs">{JSON.stringify(initStatus.adminDetails, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tools" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Test Login
                </CardTitle>
                <CardDescription>Test login with default credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Username:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">admin</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Password:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">password123</code>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/login">
                    <Key className="mr-2 h-4 w-4" />
                    Go to Login Page
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Ensure the database connection is working</li>
                  <li>Initialize the test admin if no admins exist</li>
                  <li>Try logging in with the default credentials</li>
                  <li>Check server logs for detailed error messages</li>
                  <li>Verify that cookies are being set correctly</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
