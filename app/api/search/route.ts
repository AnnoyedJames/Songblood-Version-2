import { type NextRequest, NextResponse } from "next/server"
import { searchDonors } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { AppError, ErrorType } from "@/lib/error-handling"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()

    // Get query parameters
    const url = new URL(request.url)
    const query = url.searchParams.get("query") || ""
    const showInactive = url.searchParams.get("showInactive") === "true"

    // Log the search request for debugging
    console.log(`Search request: query="${query}", showInactive=${showInactive}`)

    // Check if we're in a preview environment
    const isPreviewEnvironment =
      process.env.VERCEL_ENV === "preview" ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
      process.env.NODE_ENV === "development"

    // For preview environments, return mock data
    if (isPreviewEnvironment) {
      console.log("Using mock data for search in preview environment")

      // Create mock data based on the query
      const mockData = [
        {
          type: "RedBlood",
          bag_id: 1001,
          donor_name: "John Doe",
          blood_type: "A",
          rh: "+",
          amount: 450,
          expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          hospital_name: "Central Hospital",
          hospital_id: 1,
          active: true,
        },
        {
          type: "Plasma",
          bag_id: 2001,
          donor_name: "Jane Smith",
          blood_type: "O",
          rh: "",
          amount: 300,
          expiration_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          hospital_name: "Central Hospital",
          hospital_id: 1,
          active: true,
        },
        {
          type: "Platelets",
          bag_id: 3001,
          donor_name: "Robert Johnson",
          blood_type: "B",
          rh: "-",
          amount: 250,
          expiration_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          hospital_name: "Central Hospital",
          hospital_id: 1,
          active: true,
        },
        {
          type: "RedBlood",
          bag_id: 1002,
          donor_name: "Sarah Williams",
          blood_type: "AB",
          rh: "+",
          amount: 400,
          expiration_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          hospital_name: "Central Hospital",
          hospital_id: 1,
          active: false,
        },
      ]

      // Filter mock data based on query and showInactive
      const filteredMockData = mockData.filter((entry) => {
        // Filter by active status
        if (!showInactive && !entry.active) return false

        // Filter by query
        if (query && !entry.donor_name.toLowerCase().includes(query.toLowerCase())) {
          // If query is a number, check bag_id
          if (!isNaN(Number(query)) && entry.bag_id === Number(query)) {
            return true
          }
          return false
        }

        return true
      })

      return NextResponse.json({ results: filteredMockData })
    }

    // Search for donors
    const results = await searchDonors(query, showInactive)

    // Return the results
    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error in search API:", error)

    // Handle specific error types
    if (error instanceof AppError) {
      if (error.type === ErrorType.AUTHENTICATION) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      } else if (error.type === ErrorType.DATABASE_CONNECTION) {
        return NextResponse.json({ error: "Database connection error" }, { status: 503 })
      }
    }

    // Default error response
    return NextResponse.json({ error: "Failed to search donors" }, { status: 500 })
  }
}
