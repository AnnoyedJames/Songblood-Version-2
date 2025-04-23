import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login" || path === "/"

  // Get authentication status from cookies
  const adminId = request.cookies.get("adminId")?.value
  const hospitalId = request.cookies.get("hospitalId")?.value
  const isAuthenticated = adminId && hospitalId

  // Redirect logic
  if (!isAuthenticated && !isPublicPath) {
    // Redirect to login if trying to access protected route without authentication
    const url = new URL("/login", request.url)
    // Add a redirect reason to help with debugging
    url.searchParams.set("reason", "unauthenticated")
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && path === "/login") {
    // Redirect to dashboard if already authenticated and trying to access login
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Configure middleware to run on specific paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
