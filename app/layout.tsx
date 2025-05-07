import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { Inter } from "next/font/google"
import { SessionProvider } from "@/components/session-provider"
import GlobalLogout from "@/components/global-logout"
import SessionMonitor from "@/components/session-monitor"
import { AppErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Songblood Admin Portal",
  description: "Blood Bank Management System",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <AppErrorBoundary>
            {/* We'll handle the header in each page instead of the layout */}
            <main className="container mx-auto px-4 py-8">{children}</main>
            <GlobalLogout />
            <SessionMonitor />
            <Toaster />
          </AppErrorBoundary>
        </SessionProvider>
      </body>
    </html>
  )
}
