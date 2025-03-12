"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/app/manufacturing/lib/utils"
import {
  LineChart,
  BarChart,
  PlusCircle,
  Grid,
  FileText,
  GitBranch,
  MapPin,
  Building2,
  Cpu,
  Home,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Factory,
  History
} from "lucide-react"
import { ThemeSwitcher } from "@/components/utilities/theme-switcher"
import { UserButton } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function ManufacturingNavbar() {
  const pathname = usePathname()

  // Dashboard dropdown items
  const dashboardItems = [
    {
      name: "Home",
      href: "/",
      icon: <Home className="mr-2 size-4" />
    },
    {
      name: "Analytics",
      href: "/manufacturing/analytics",
      icon: <LineChart className="mr-2 size-4" />
    },
    {
      name: "Documentation",
      href: "/manufacturing/docs",
      icon: <FileText className="mr-2 size-4" />
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="mr-2 size-4" />
    }
  ]

  // Manufacturing dropdown items
  const manufacturingItems = [
    {
      name: "Production",
      href: "/manufacturing",
      icon: <BarChart className="mr-2 size-4" />
    },
    {
      name: "History",
      href: "/manufacturing/history",
      icon: <History className="mr-2 size-4" />
    },
    {
      name: "Input",
      href: "/manufacturing/input",
      icon: <PlusCircle className="mr-2 size-4" />
    },
    {
      name: "Cells",
      href: "/manufacturing/cells",
      icon: <Grid className="mr-2 size-4" />
    },
    {
      name: "Machines",
      href: "/manufacturing/machines",
      icon: <Cpu className="mr-2 size-4" />
    },
    {
      name: "Value Streams",
      href: "/manufacturing/value-streams",
      icon: <GitBranch className="mr-2 size-4" />
    },
    {
      name: "Sites",
      href: "/manufacturing/sites",
      icon: <MapPin className="mr-2 size-4" />
    },
    {
      name: "Companies",
      href: "/manufacturing/companies",
      icon: <Building2 className="mr-2 size-4" />
    }
  ]

  return (
    <div className="mb-6 flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-4">
        {/* Dashboard Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1">
              <LayoutDashboard className="size-4" />
              Dashboard
              <ChevronDown className="size-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Dashboard Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {dashboardItems.map(item => (
              <Link key={item.href} href={item.href}>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer",
                    pathname === item.href && "bg-muted"
                  )}
                >
                  {item.icon}
                  {item.name}
                </DropdownMenuItem>
              </Link>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Manufacturing Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1">
              <Factory className="size-4" />
              Manufacturing
              <ChevronDown className="size-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Manufacturing Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {manufacturingItems.map(item => (
              <Link key={item.href} href={item.href}>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer",
                    pathname === item.href && "bg-muted"
                  )}
                >
                  {item.icon}
                  {item.name}
                </DropdownMenuItem>
              </Link>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center space-x-3">
        <ThemeSwitcher />
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  )
}
