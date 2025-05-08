"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle2, XCircle, Database, User, Key, RefreshCw, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AuthDiagnosticsPage() {
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [fixLoading, setFixLoading] = useState(false)
  const [fixResult, setFixResult] = useState<any>(null)
  const [username, setUsername] = useState("admin")

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/check-database")
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      setDbStatus({
        connection: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFixAction = async (action: string) => {
    setFixLoading(true)
    setFixResult(null)
    try {
      const response = await fetch("/api/admin/fix-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })
      const data = await response.json()
      setFixResult(data)

      // Refresh database status
      await checkDatabaseStatus()
    } catch (error) {
      setFixResult({
        error: "Failed to execute action",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setFixLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setFixLoading(true)
    setFixResult(null)
    try {
      const response = await fetch("/api/admin/fix-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reset_admin_password", username }),
      })
      const data = await response.json()
      setFixResult(data)

      // Refresh database status
      await checkDatabaseStatus()
    } catch (error) {
      setFixResult({
        error: "Failed to reset password",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setFixLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Authentication Diagnostics</h1>
          <div className="flex gap-2">
            <Button onClick={checkDatabaseStatus} variant="outline" size="sm" className="gap-1">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Database Status</TabsTrigger>
            <TabsTrigger value="tools">Fix Tools</TabsTrigger>
            <TabsTrigger value="help">Troubleshooting</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Database Connection
                </CardTitle>
                <CardDescription>Current status of the database connection</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !dbStatus?.connection?.success ? (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>
                      {dbStatus?.connection?.error || "Failed to connect to database"}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Connected</AlertTitle>
                    <AlertDescription>
                      Successfully connected to the database. Server time:{" "}
                      {new Date(dbStatus.connection.serverTime).toLocaleString()}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {dbStatus?.connection?.success && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="mr-2 h-5 w-5" />
                      Database Tables
                    </CardTitle>
                    <CardDescription>Status of required database tables</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(dbStatus.tables || {}).map(([tableName, tableInfo]: [string, any]) => (
                        <div key={tableName} className="border rounded-md p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium flex items-center">
                              {tableInfo.exists ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 mr-2" />
                              )}
                              {tableName}
                            </h3>
                            <span className={tableInfo.exists ? "text-green-600" : "text-red-600"}>
                              {tableInfo.exists ? `${tableInfo.count} records` : "Missing"}
                            </span>
                          </div>

                          {tableInfo.exists && tableInfo.columns && (
                            <div className="mt-2">
                              <h4 className="text-xs font-medium text-gray-500 mb-1">Columns:</h4>
                              <div className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                                {tableInfo.columns.map((col: any, index: number) => (
                                  <div key={index} className="flex justify-between">
                                    <span>{col.column_name}</span>
                                    <span className="text-gray-500">{col.data_type}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Admin Accounts
                    </CardTitle>
                    <CardDescription>Available admin accounts in the database</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!dbStatus.adminAccounts?.exists ? (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Admin Table Missing</AlertTitle>
                        <AlertDescription>
                          {dbStatus.adminAccounts?.error || "The admins table does not exist."}
                        </AlertDescription>
                      </Alert>
                    ) : dbStatus.adminAccounts.count === 0 ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Admin Accounts</AlertTitle>
                        <AlertDescription>
                          No admin accounts found in the database. Create a test admin to continue.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-600">Admin Accounts Found</AlertTitle>
                          <AlertDescription>
                            Found {dbStatus.adminAccounts.count} admin account(s) in the database.
                          </AlertDescription>
                        </Alert>

                        <div className="overflow-auto max-h-60">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ID
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Username
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Hospital ID
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Password Hash
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Created
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {dbStatus.adminAccounts.admins.map((admin: any) => (
                                <tr key={admin.id}>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">{admin.id}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">{admin.username}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">{admin.hospital_id}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    <span
                                      className={
                                        admin.password_hash_preview === "NULL" ||
                                        admin.password_hash_preview === "EMPTY"
                                          ? "text-red-500"
                                          : ""
                                      }
                                    >
                                      {admin.password_hash_preview} ({admin.password_hash_length} chars)
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    {new Date(admin.created_at).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="tools" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Fix Tools</CardTitle>
                <CardDescription>Tools to fix common database issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleFixAction("create_tables")}
                    disabled={fixLoading}
                    className="h-auto py-4 flex flex-col items-center justify-center"
                  >
                    <Database className="h-5 w-5 mb-1" />
                    <span>Create Missing Tables</span>
                    <span className="text-xs mt-1 font-normal">Creates required database tables</span>
                  </Button>

                  <Button
                    onClick={() => handleFixAction("create_test_admin")}
                    disabled={fixLoading}
                    className="h-auto py-4 flex flex-col items-center justify-center"
                  >
                    <User className="h-5 w-5 mb-1" />
                    <span>Create Test Admin</span>
                    <span className="text-xs mt-1 font-normal">Creates admin/password123 account</span>
                  </Button>

                  <Button
                    onClick={() => handleFixAction("fix_password_hashes")}
                    disabled={fixLoading}
                    className="h-auto py-4 flex flex-col items-center justify-center"
                  >
                    <Key className="h-5 w-5 mb-1" />
                    <span>Fix Password Hashes</span>
                    <span className="text-xs mt-1 font-normal">Converts plain text passwords to bcrypt</span>
                  </Button>

                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium mb-2">Reset Admin Password</h3>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Username"
                          className="flex-1"
                        />
                        <Button onClick={handleResetPassword} disabled={fixLoading || !username.trim()}>
                          Reset
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">Resets password to "password123"</p>
                    </div>
                  </div>
                </div>

                {fixLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Processing...</span>
                  </div>
                )}

                {fixResult && (
                  <Alert className={fixResult.error ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}>
                    {fixResult.error ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    <AlertTitle className={fixResult.error ? "text-red-600" : "text-green-600"}>
                      {fixResult.error ? "Error" : "Success"}
                    </AlertTitle>
                    <AlertDescription>
                      {fixResult.error ? fixResult.error : fixResult.message}
                      {fixResult.details && (
                        <div className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded">{fixResult.details}</div>
                      )}
                      {fixResult.newPassword && (
                        <div className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded">
                          New password: <code className="bg-gray-100 px-1 py-0.5 rounded">{fixResult.newPassword}</code>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Troubleshooting</CardTitle>
                <CardDescription>Common issues and solutions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Invalid Username or Password Error</h3>
                    <div className="space-y-2 text-sm">
                      <p>If you're seeing "Invalid username or password" even with correct credentials:</p>
                      <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li>Check if the admin account exists in the database</li>
                        <li>Verify the password hash format (should be bcrypt)</li>
                        <li>Reset the admin password using the fix tool</li>
                        <li>Try logging in with username "admin" and password "password123"</li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Database Connection Issues</h3>
                    <div className="space-y-2 text-sm">
                      <p>If you're having database connection problems:</p>
                      <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li>Verify the DATABASE_URL environment variable is set correctly</li>
                        <li>Check if the database server is running and accessible</li>
                        <li>Ensure the database user has proper permissions</li>
                        <li>Check for network connectivity issues</li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Missing Tables or Data</h3>
                    <div className="space-y-2 text-sm">
                      <p>If database tables or data are missing:</p>
                      <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li>Use the "Create Missing Tables" tool to create required tables</li>
                        <li>Use the "Create Test Admin" tool to create a test admin account</li>
                        <li>Check database logs for any errors during table creation</li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Password Hash Issues</h3>
                    <div className="space-y-2 text-sm">
                      <p>If there are issues with password hashes:</p>
                      <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li>Use the "Fix Password Hashes" tool to convert plain text passwords to bcrypt</li>
                        <li>Reset the admin password to create a new properly hashed password</li>
                        <li>Verify the password hash in the database starts with "$2" (bcrypt format)</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/login">
                    <Key className="mr-2 h-4 w-4" />
                    Return to Login Page
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
