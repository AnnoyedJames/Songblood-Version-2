import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

// Force dynamic rendering since we're using cookies
export const dynamic = "force-dynamic"

export default async function Home() {
  try {
    const session = await getSession()

    // If no session, redirect to login
    if (!session) {
      redirect("/login")
    }

    // If session exists, redirect to dashboard
    redirect("/dashboard")
  } catch (error) {
    console.error("Home page error:", error)

    // If there's an error, redirect to login as a fallback
    redirect("/login")
  }
}
