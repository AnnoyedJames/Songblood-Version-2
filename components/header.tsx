"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import LogoutButton from "./logout-button"

type HeaderProps = {
  hospitalId: number
}

export default function Header({ hospitalId }: HeaderProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Songblood</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/dashboard"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/dashboard") ? "text-primary" : "text-muted-foreground",
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/add-entry"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/add-entry") ? "text-primary" : "text-muted-foreground",
              )}
            >
              Add Entry
            </Link>
            <Link
              href="/view-data"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/view-data") ? "text-primary" : "text-muted-foreground",
              )}
            >
              View Data
            </Link>
            <Link
              href="/surplus"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/surplus") || pathname.startsWith("/surplus/") ? "text-primary" : "text-muted-foreground",
              )}
            >
              Surplus
            </Link>
            <Link
              href="/diagnostics"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/diagnostics") ? "text-primary" : "text-muted-foreground",
              )}
            >
              Diagnostics
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
