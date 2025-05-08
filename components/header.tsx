import Link from "next/link"
import { getHospitalById } from "@/lib/db"
import LogoutButton from "@/components/logout-button"
import NavLink from "@/components/nav-link"
import FallbackModeIndicator from "@/components/fallback-mode-indicator"
import DbConnectionStatus from "@/components/db-connection-status"

interface HeaderProps {
  hospitalId: number
}

export default async function Header({ hospitalId }: HeaderProps) {
  let hospitalName = "Unknown Hospital"

  try {
    const hospital = await getHospitalById(hospitalId)
    hospitalName = hospital.hospital_name
  } catch (error) {
    console.error("Error fetching hospital name:", error)
  }

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-red-600 font-bold text-xl">Songblood</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/dashboard" activeClassName="text-red-600 font-medium">
              Dashboard
            </NavLink>
            <NavLink href="/add-entry" activeClassName="text-red-600 font-medium">
              Add Entry
            </NavLink>
            <NavLink href="/delete-edit" activeClassName="text-red-600 font-medium">
              Delete/Edit
            </NavLink>
            <NavLink href="/data-analysis" activeClassName="text-red-600 font-medium">
              Data Analysis
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{hospitalName}</span>
          </div>
          <FallbackModeIndicator />
          <DbConnectionStatus />
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
