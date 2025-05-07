"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface HeaderProps {
  hospitalId?: number
}

export default function Header({ hospitalId }: HeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account.",
        })
        window.location.href = "/login"
      } else {
        throw new Error("Logout failed")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was a problem logging you out. Please try again.",
      })
    }
  }

  const isActive = (path: string) => {
    return pathname === path
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:text-foreground hover:bg-muted"
  }

  return (
    <header className="bg-white border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="font-bold text-xl">
            Blood Bank
            {hospitalId && (
              <span className="text-sm font-normal ml-2 text-muted-foreground">Hospital #{hospitalId}</span>
            )}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/dashboard")}`}
          >
            Dashboard
          </Link>
          <Link
            href="/view-data"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/view-data")}`}
          >
            View Data
          </Link>
          <Link
            href="/add-entry"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/add-entry")}`}
          >
            Add Entry
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-2 px-4">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/dashboard")}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/view-data"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/view-data")}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                View Data
              </Link>
              <Link
                href="/add-entry"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/add-entry")}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Add Entry
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 w-full justify-start">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
