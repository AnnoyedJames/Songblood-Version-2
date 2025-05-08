import type { Metadata } from "next"
import LoginForm from "./login-form"
import DbConnectionStatus from "@/components/db-connection-status"
import PreviewModeIndicator from "@/components/preview-mode-indicator"
import { isPreviewEnvironment } from "@/lib/db-config"

export const metadata: Metadata = {
  title: "Login | Blood Bank Management System",
  description: "Login to the Blood Bank Management System",
}

export default function LoginPage() {
  const isPreview = isPreviewEnvironment()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      {isPreview && <PreviewModeIndicator />}

      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Blood Bank Management System</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <DbConnectionStatus />
          <LoginForm />
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>© 2023 Blood Bank Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
