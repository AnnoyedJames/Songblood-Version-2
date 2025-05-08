import Link from "next/link"
import { getHospitalById } from "@/lib/db"
import NavLink from "./nav-link"
import LogoutButton from "./logout-button"
import DbConnectionStatus from "./db-connection-status"
import FallbackModeIndicator from "./fallback-mode-indicator"
import { Droplets } from "lucide-react"

export default async function Header({ hospitalId }: { hospitalId: number }) {
  // Fetch hospital data
  const hospital = await getHospitalById(hospitalId)

  return (
    <header className="bg-white border-b">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-xl text-primary">
            Songblood
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/add-entry">Add Entry</NavLink>
            <NavLink href="/donor-search">Donor Search</NavLink>
            <NavLink href="/surplus">
              <span className="flex items-center gap-1">
                <Droplets className="h-4 w-4" />
                Surplus
              </span>
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <FallbackModeIndicator />
          <DbConnectionStatus />
          <div className="hidden md:block text-sm text-right">
            <div className="font-medium">{hospital.hospital_name}</div>
            <div className="text-muted-foreground text-xs">ID: {hospitalId}</div>
          </div>
          <LogoutButton />
        </div>
      </div>
      <div className="md:hidden border-t">
        <nav className="container flex items-center justify-between px-4 py-2 overflow-x-auto">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/add-entry">Add Entry</NavLink>
          <NavLink href="/donor-search">Donor Search</NavLink>
          <NavLink href="/surplus">
            <span className="flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5" />
              Surplus
            </span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
