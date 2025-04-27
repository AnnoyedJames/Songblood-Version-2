import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login" || path === "/" || path === "/register"

  // Get authentication status from cookies
  const adminId = request.cookies.get("adminId")?.value
  const hospitalId = request.cookies.get("hospitalId")?.value
  const isAuthenticated = adminId && hospitalId

  // Redirect logic
  if (!isAuthenticated && !isPublicPath) {
    // Redirect to login if trying to access protected route without authentication
    const url = new URL("/login", request.url)
    url.searchParams.set("reason", "session-expired")

    // Log the redirect for debugging
    console.log(`Middleware redirecting unauthenticated user from ${path} to ${url.toString()}`)

    return NextResponse.redirect(url)
  }

  if (isAuthenticated && (path === "/login" || path === "/register")) {
    // Redirect to dashboard if already authenticated and trying to access login or register
    const url = new URL("/dashboard", request.url)

    // Log the redirect for debugging
    console.log(`Middleware redirecting authenticated user from ${path} to ${url.toString()}`)

    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Configure middleware to run on specific paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
