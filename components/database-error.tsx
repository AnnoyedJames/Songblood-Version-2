import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ServerCrash } from "lucide-react"

interface DatabaseErrorProps {
  message: string
  showHomeLink?: boolean
}

export default function DatabaseError({ message, showHomeLink = true }: DatabaseErrorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <ServerCrash className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Database Connection Error</h1>
        <p className="mt-2 text-gray-600">{message}</p>

        {showHomeLink && (
          <div className="mt-6">
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
