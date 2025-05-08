import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import RegisterForm from "./register-form"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function RegisterPage() {
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
        <RegisterForm />
      </div>
    </div>
  )
}
