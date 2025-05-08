import type { Metadata } from "next"
import LoginForm from "./login-form"
import DbConnectionStatus from "@/components/db-connection-status"

export const metadata: Metadata = {
  title: "Login | Blood Inventory Management",
  description: "Login to the Blood Inventory Management System",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <DbConnectionStatus />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Blood Inventory Management</h1>
              <p className="text-gray-600 mt-2">Sign in to your account</p>
            </div>

            <LoginForm />
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Blood Inventory Management System</p>
        </div>
      </div>
    </div>
  )
}
