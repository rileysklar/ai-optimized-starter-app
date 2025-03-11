"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LineChart, BarChart, PlusCircle } from "lucide-react"

export function ManufacturingNavbar() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Production",
      href: "/manufacturing",
      icon: <BarChart className="mr-2 size-4" />
    },
    {
      name: "Input",
      href: "/manufacturing/input",
      icon: <PlusCircle className="mr-2 size-4" />
    },
    {
      name: "Analytics",
      href: "/manufacturing/analytics",
      icon: <LineChart className="mr-2 size-4" />
    }
  ]

  return (
    <div className="mb-6 flex items-center border-b p-4">
      <nav className="flex gap-4">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}
