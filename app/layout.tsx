import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/session-provider"
import { Toaster } from "@/components/ui/toaster"
import GlobalLogout from "@/components/global-logout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Songblood - Blood Inventory Management",
  description: "Hospital blood inventory management system",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster />
          <GlobalLogout />
        </SessionProvider>
      </body>
    </html>
  )
}
