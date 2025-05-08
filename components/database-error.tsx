import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type DatabaseErrorProps = {
  message?: string
  showHomeLink?: boolean
  showLoginLink?: boolean
}

export default function DatabaseError({
  message = "Unable to connect to the database. Please try again later.",
  showHomeLink = true,
  showLoginLink = true,
}: DatabaseErrorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold mb-4">Database Connection Error</h1>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showHomeLink && (
            <Button asChild variant="outline">
              <Link href="/">Return to Home</Link>
            </Button>
          )}
          {showLoginLink && (
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
