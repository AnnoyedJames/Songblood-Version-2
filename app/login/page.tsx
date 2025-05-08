import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginForm from "./login-form"
import DbConnectionStatus from "@/components/db-connection-status"
import RedirectHandler from "@/components/redirect-handler"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { registered?: string; reason?: string; returnTo?: string }
}) {
  const session = await getSession()

  if (session) {
    // If there's a returnTo parameter, redirect there after login
    if (searchParams.returnTo) {
      const decodedReturnTo = decodeURIComponent(searchParams.returnTo)
      // Validate the returnTo URL to prevent open redirect vulnerabilities
      if (decodedReturnTo.startsWith("/") && !decodedReturnTo.includes("//")) {
        redirect(decodedReturnTo)
      }
    }
    redirect("/dashboard")
  }

  const justRegistered = searchParams.registered === "true"
  const redirectReason = searchParams.reason
  const returnTo = searchParams.returnTo

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold">Songblood</h1>
          <p className="mt-2 text-gray-600">Hospital Blood Inventory Management</p>
          {justRegistered && (
            <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-md">
              Registration successful! Please log in with your new credentials.
            </div>
          )}
          {redirectReason === "session-timeout" && (
            <div className="mt-4 p-3 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
              <p className="font-medium">Your session has expired</p>
              <p className="text-sm mt-1">Please log in again to continue your work.</p>
              {returnTo && <p className="text-xs mt-2">You'll be redirected back to your previous page after login.</p>}
            </div>
          )}
        </div>

        {redirectReason && <RedirectHandler reason={redirectReason} />}
        <DbConnectionStatus />
        <LoginForm returnTo={returnTo} />

        <div className="mt-4 text-center">
          <Button variant="outline" asChild className="w-full">
            <Link href="/register">Don't have an account? Register</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
