import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import ProgressBarWrapper from "@/components/progress-bar-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Songblood - Hospital Blood Inventory Management",
  description: "Admin portal for Bangkok hospitals to manage blood inventories",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <ProgressBarWrapper />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
