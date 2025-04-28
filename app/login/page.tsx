import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginForm from "./login-form"
import DbConnectionStatus from "@/components/db-connection-status"
import RedirectHandler from "@/components/redirect-handler"
import FallbackModeIndicator from "@/components/fallback-mode-indicator"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { registered?: string; reason?: string }
}) {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  const justRegistered = searchParams.registered === "true"
  const redirectReason = searchParams.reason

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
        </div>

        <FallbackModeIndicator />
        {redirectReason && <RedirectHandler reason={redirectReason} />}
        <DbConnectionStatus />
        <LoginForm />

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Need an account?{" "}
            <a href="/register" className="text-primary hover:underline">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
