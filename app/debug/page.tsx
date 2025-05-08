import { requireAuth } from "@/lib/auth"
import Header from "@/components/header"
import DebugDataDisplay from "@/components/debug-data-display"
import { redirect } from "next/navigation"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function DebugPage() {
  try {
    const session = await requireAuth()

    // If no session, redirect to login
    if (!session) {
      redirect("/login?reason=no-session")
    }

    const { hospitalId } = session

    return (
      <div className="min-h-screen flex flex-col">
        <Header hospitalId={hospitalId} />

        <main className="flex-1 container py-6 px-4 md:py-8">
          <h1 className="text-2xl font-bold mb-6">Debug Data Structure</h1>

          <div className="max-w-6xl mx-auto">
            <DebugDataDisplay />
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error("Debug page error:", error)
    return <div>Error loading debug page</div>
  }
}
