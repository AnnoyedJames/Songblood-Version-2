import { getSession } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function Home() {
  try {
    const session = await getSession()

    // Instead of redirecting, we'll render a simple UI with links
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mb-6">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Songblood</h1>
        <p className="text-gray-600 mb-8">Hospital Blood Inventory Management</p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          {session ? (
            <Button asChild size="lg">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error("Home page error:", error)

    // If there's an error, render a simple UI instead of redirecting
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mb-6">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Songblood</h1>
        <p className="text-gray-600 mb-8">Hospital Blood Inventory Management</p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button asChild size="lg">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    )
  }
}
