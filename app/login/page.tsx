import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginForm from "./login-form"
import FallbackLogin from "./fallback-login"

export default async function LoginPage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold">Songblood</h1>
          <p className="mt-2 text-gray-600">Hospital Blood Inventory Management</p>
        </div>
        <LoginForm />
        <FallbackLogin />
      </div>
    </div>
  )
}
