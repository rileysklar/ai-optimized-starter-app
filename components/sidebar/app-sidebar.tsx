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
  History,
  Home,
  PlusCircle,
  Building,
  GitBranch,
  MapPin,
  Cpu,
  Book,
  LineChart,
  Factory,
  Anvil,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeSwitcher } from "@/components/utilities/theme-switcher"
import { UserButton } from "@clerk/nextjs"
import { useState, useEffect } from "react"

// Custom hook to track navigation state
function useNavigationLoading() {
  const pathname = usePathname()
  const [loadingItem, setLoadingItem] = useState<string | null>(null)
  const [prevPathname, setPrevPathname] = useState(pathname)

  useEffect(() => {
    // When pathname changes, navigation has completed
    if (prevPathname !== pathname) {
      setLoadingItem(null)
      setPrevPathname(pathname)
    }
  }, [pathname, prevPathname])

  // Function to set loading state on navigation start
  const onNavigate = (href: string) => {
    if (href !== pathname) {
      setLoadingItem(href)
    }
  }

  return { loadingItem, onNavigate }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { loadingItem, onNavigate } = useNavigationLoading()

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
      href: "/manufacturing/docs",
      icon: Book
    },
    {
      title: "History",
      href: "/manufacturing/history",
      icon: History
    }
  ]

  const manufacturingItems = [
    {
      title: "Attainment",
      href: "/manufacturing",
      icon: BarChart
    },
    {
      title: "Parts",
      href: "/manufacturing/input",
      icon: Anvil
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
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2 hover:cursor-pointer hover:opacity-80">
              <Link
                href="/"
                className="flex items-center text-xl font-bold"
                onClick={() => onNavigate("/")}
              >
                <Factory className="mr-2 size-4" />
                CellFlow
              </Link>
            </div>
          </div>

          {loadingItem === "/" && (
            <div className="flex items-center" title="Loading...">
              <Loader2 className="text-primary ml-2 size-4 animate-spin" />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <div className="space-y-1">
          <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
            Dashboard
          </p>

          {navItems.map(item => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href)

            return (
              <div key={item.href} className="flex flex-col gap-2">
                <Link href={item.href} onClick={() => onNavigate(item.href)}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <item.icon className="size-4" />
                    {item.title}
                    {loadingItem === item.href && (
                      <Loader2 className="text-muted-foreground ml-auto size-3 animate-spin" />
                    )}
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>

        <div className="mt-6 space-y-1">
          <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
            Manufacturing
          </p>

          {manufacturingItems.map(item => {
            const isActive =
              item.href === "/manufacturing"
                ? pathname === "/manufacturing" ||
                  pathname === "/manufacturing/"
                : pathname?.startsWith(item.href)

            return (
              <div key={item.href} className="flex flex-col gap-2">
                <Link href={item.href} onClick={() => onNavigate(item.href)}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <item.icon className="size-4" />
                    {item.title}
                    {loadingItem === item.href && (
                      <Loader2 className="text-muted-foreground ml-auto size-3 animate-spin" />
                    )}
                  </Button>
                </Link>
              </div>
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
