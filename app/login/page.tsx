import type { Metadata } from "next"
import LoginForm from "./login-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Database, Wrench } from "lucide-react"

export const metadata: Metadata = {
  title: "Login | Blood Bank",
  description: "Login to the Blood Bank Management System",
}

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Blood Bank</h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Sign in to your account</h2>
        </div>
        <LoginForm />

        <div className="text-center mt-4 flex justify-center space-x-4">
          <Button asChild variant="link" size="sm" className="text-gray-500">
            <Link href="/admin/database-status" className="flex items-center justify-center">
              <Database className="h-4 w-4 mr-1" />
              Database Status
            </Link>
          </Button>
          <Button asChild variant="link" size="sm" className="text-gray-500">
            <Link href="/admin/auth-diagnostics" className="flex items-center justify-center">
              <Wrench className="h-4 w-4 mr-1" />
              Auth Diagnostics
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
