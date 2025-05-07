import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Log the requested URL for debugging
  console.log("Middleware - Requested URL:", request.nextUrl.pathname)

  // Continue to the requested page
  return NextResponse.next()
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    // Apply to all routes
    "/(.*)",
  ],
}
