import Link from "next/link"
import { getHospitalById } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu } from "lucide-react"
import NavLink from "./nav-link"
import { AppError, ErrorType } from "@/lib/error-handling"
import { LogoutButton } from "./logout-button"

type HeaderProps = {
  hospitalId: number
}

export default async function Header({ hospitalId }: HeaderProps) {
  // Wrap in try-catch to handle any errors
  let hospital
  try {
    hospital = await getHospitalById(hospitalId)
  } catch (error) {
    console.error("Error fetching hospital:", error)

    // Use a generic name if there's a database error
    if (error instanceof AppError && error.type === ErrorType.DATABASE_CONNECTION) {
      hospital = { hospital_name: "Hospital" }
    } else {
      throw error
    }
  }

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="font-bold text-xl hidden md:inline-block">Songblood</span>
          </Link>
          <span className="text-muted-foreground hidden md:inline-block">|</span>
          <span className="text-sm md:text-base truncate max-w-[200px] md:max-w-none">
            {hospital?.hospital_name || "Hospital"}
          </span>
        </div>

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard" prefetch={true}>
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/add-entry" prefetch={true}>
                  Add Entry
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/donor-search" prefetch={true}>
                  Donor Search
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/diagnostics" prefetch={true}>
                  Data Diagnostics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <LogoutButton mobile={true} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/dashboard" activeClassName="text-primary font-semibold">
            Dashboard
          </NavLink>
          <NavLink href="/add-entry" activeClassName="text-primary font-semibold">
            Add Entry
          </NavLink>
          <NavLink href="/donor-search" activeClassName="text-primary font-semibold">
            Donor Search
          </NavLink>
          <NavLink href="/diagnostics" activeClassName="text-primary font-semibold">
            Data Diagnostics
          </NavLink>
          <LogoutButton variant="ghost" size="sm" />
        </nav>
      </div>
    </header>
  )
}
