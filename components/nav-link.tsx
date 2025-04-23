"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type NavLinkProps = {
  href: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
}

export default function NavLink({ href, children, className, activeClassName }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn("text-sm font-medium transition-colors hover:text-primary", className, isActive && activeClassName)}
      prefetch={true}
    >
      {children}
    </Link>
  )
}
