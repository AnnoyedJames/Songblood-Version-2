"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { testLogout } from "@/lib/test-logout"
import { LogOut } from "lucide-react"

export default function TestLogoutPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTest = async () => {
    setIsLoading(true)
    try {
      const results = await testLogout()
      setTestResults(results)
    } catch (error) {
      setTestResults({
        success: false,
        message: "Test failed with an exception",
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Logout Functionality Test</CardTitle>
          <CardDescription>
            This page tests the logout functionality to ensure it properly clears all cookies and session data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTest} disabled={isLoading} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            {isLoading ? "Running Test..." : "Test Logout"}
          </Button>

          {testResults && (
            <div
              className={`p-4 rounded-md ${testResults.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              <h3 className="font-medium">{testResults.success ? "Test Passed" : "Test Failed"}</h3>
              <p>{testResults.message}</p>
              {testResults.remainingCookies && (
                <div className="mt-2">
                  <p>Remaining cookies:</p>
                  <ul className="list-disc pl-5">
                    {testResults.remainingCookies.map((cookie: string) => (
                      <li key={cookie}>{cookie}</li>
                    ))}
                  </ul>
                </div>
              )}
              {testResults.error && <p className="mt-2">Error: {testResults.error}</p>}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Note: After running the test, you may be redirected to the login page if the test is successful.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
