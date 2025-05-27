"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <span className="font-bold">AuthService</span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/dashboard"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/dashboard" ? "text-primary" : "text-muted-foreground",
          )}
        >
          Dashboard
        </Link>
        <Link
          href="/profile"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/profile" ? "text-primary" : "text-muted-foreground",
          )}
        >
          Profile
        </Link>
        <Link
          href="/admin"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/admin" ? "text-primary" : "text-muted-foreground",
          )}
        >
          Admin
        </Link>
      </nav>
    </div>
  )
}
