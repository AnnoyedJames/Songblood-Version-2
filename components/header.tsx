import Link from "next/link"
import { getHospitalById } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, Menu } from "lucide-react"
import NavLink from "./nav-link"
import { AppError, ErrorType } from "@/lib/error-handling"

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
                <form action="/api/logout" method="POST">
                  <button className="w-full text-left flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </form>
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
          <form action="/api/logout" method="POST">
            <Button variant="ghost" size="sm" className="gap-1">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </form>
        </nav>
      </div>
    </header>
  )
}
