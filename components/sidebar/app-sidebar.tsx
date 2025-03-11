/*
<ai_context>
This client component provides a simplified sidebar for the app.
Updated with a cleaner design that matches Shadcn UI's minimal aesthetic.
User controls moved back to the navbar.
</ai_context>
*/

"use client"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader
} from "@/components/ui/sidebar"
import {
  BarChart,
  Contact,
  Home,
  PlusCircle,
  Building,
  GitBranch,
  MapPin,
  Cpu,
  Book,
  LineChart,
  Factory
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeSwitcher } from "@/components/utilities/theme-switcher"
import { UserButton } from "@clerk/nextjs"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Home",
      href: "/",
      icon: Home
    },
    {
      title: "Analytics",
      href: "/manufacturing/analytics",
      icon: LineChart
    },
    // {
    //   title: "Contacts",
    //   href: "/contacts",
    //   icon: Contact
    // },
    {
      title: "Docs",
      href: "/docs",
      icon: Book
    }
  ]

  const manufacturingItems = [
    {
      title: "Production",
      href: "/manufacturing",
      icon: BarChart
    },
    {
      title: "Input",
      href: "/manufacturing/input",
      icon: PlusCircle
    },

    {
      title: "Cells",
      href: "/manufacturing/cells",
      icon: Building
    },
    {
      title: "Machines",
      href: "/manufacturing/machines",
      icon: Cpu
    },
    {
      title: "Value Streams",
      href: "/manufacturing/value-streams",
      icon: GitBranch
    },
    {
      title: "Sites",
      href: "/manufacturing/sites",
      icon: MapPin
    },
    {
      title: "Companies",
      href: "/manufacturing/companies",
      icon: Building
    }
  ]

  return (
    <Sidebar
      collapsible="icon"
      className="border-border bg-background shrink-0 border-r"
      {...props}
    >
      <SidebarHeader className="p-3">
        <div className="flex items-center px-2 py-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2 hover:cursor-pointer hover:opacity-80">
              <Link href="/" className="flex items-center text-xl font-bold">
                <Factory className="mr-2 size-4" />
                CellFlow
              </Link>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <div className="space-y-1">
          <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
            Navigation
          </p>

          {navItems.map(item => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href)

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  <item.icon className="size-4" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </div>

        <div className="mt-6 space-y-1">
          <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
            Manufacturing
          </p>

          {manufacturingItems.map(item => {
            const isActive = pathname?.startsWith(item.href)

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  <item.icon className="size-4" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </div>
      </SidebarContent>

      <SidebarFooter className="flex p-3">
        <div className="flex justify-end space-x-3">
          <ThemeSwitcher />
          <UserButton afterSignOutUrl="/" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
