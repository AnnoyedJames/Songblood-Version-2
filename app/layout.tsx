import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toast"
import SessionProvider from "@/components/session-provider"
import GlobalLogout from "@/components/global-logout"
import SessionMonitor from "@/components/session-monitor"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Songblood - Blood Inventory Management",
  description: "Hospital blood inventory management system",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <GlobalLogout />
          <SessionMonitor />
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
