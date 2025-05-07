import type { Metadata } from "next"
import LoginForm from "./login-form"
import { isPreviewEnvironment } from "@/lib/env-utils"

export const metadata: Metadata = {
  title: "Login | Blood Bank",
  description: "Login to the Blood Bank Management System",
}

export default async function LoginPage() {
  // Check if we're in a preview environment
  const isPreview = isPreviewEnvironment()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Blood Bank</h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Sign in to your account</h2>
          {isPreview && (
            <p className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
              Preview Mode: You can use any credentials to log in
            </p>
          )}
        </div>
        <LoginForm isPreview={isPreview} />
      </div>
    </div>
  )
}
