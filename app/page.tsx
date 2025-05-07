import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-2">Blood Bank Management System</h1>
        <p className="text-gray-600 mb-8">Manage your blood inventory efficiently</p>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/login">Login</Link>
          </Button>
          <div className="flex gap-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/view-data">View Data</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
