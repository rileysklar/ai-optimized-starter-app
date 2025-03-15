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
  Loader2,
  Settings,
  Box,
  Star
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeSwitcher } from "@/components/utilities/theme-switcher"
import {
  UserButton,
  useUser,
  OrganizationSwitcher,
  useOrganization
} from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"

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

// Define proper types for navigation items
interface NavItemChild {
  title: string
  href: string
  icon?: React.ComponentType<any>
  children?: NavItemChild[]
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<any>
  isExpanded?: boolean
  children?: NavItemChild[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { loadingItem, onNavigate } = useNavigationLoading()
  const { user } = useUser()
  const { organization } = useOrganization()
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"
  const userBtnRef = useRef<HTMLDivElement>(null)

  // Define platform section items
  const dashboardItems: NavItem[] = []

  // Define manufacturing section items with hierarchy
  const manufacturingItems: NavItem[] = [
    {
      title: "Attainment",
      href: "/manufacturing",
      icon: BarChart,
      isExpanded: false
    },
    {
      title: "Analytics",
      href: "/manufacturing/analytics",
      icon: LineChart
    },

    {
      title: "History",
      href: "/manufacturing/history",
      icon: History
    },
    {
      title: "Value Streams",
      href: "/manufacturing/value-streams",
      icon: GitBranch,
      isExpanded: true,
      children: [
        {
          title: "Cells",
          href: "/manufacturing/cells",
          icon: Building,
          children: [
            {
              title: "Machines",
              href: "/manufacturing/machines",
              icon: Settings
            }
          ]
        }
      ]
    },
    {
      title: "Parts",
      href: "/manufacturing/input",
      icon: Anvil
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
    },
    {
      title: "Home",
      href: "/",
      icon: Home
    },
    {
      title: "Docs",
      href: "/manufacturing/docs",
      icon: Book
    }
  ]

  // Function to handle clicking anywhere in the user area
  const handleUserAreaClick = () => {
    // Find the actual button element within the UserButton component
    const buttonElement = userBtnRef.current?.querySelector("button")
    if (buttonElement) {
      buttonElement.click()
    }
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-border bg-background shrink-0 border-r"
      {...props}
    >
      <SidebarHeader className="mt-2 px-4 py-2">
        <div className="flex w-full flex-col">
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              baseTheme: isDarkMode ? dark : undefined,
              elements: {
                rootBox: "w-full",
                organizationSwitcherTrigger: `font-semibold text-sm hover:text-primary px-3 py-2 h-auto w-full justify-start ${isDarkMode ? "text-white" : ""}`,
                organizationPreview: `w-full justify-start ${isDarkMode ? "text-white" : ""}`,
                organizationSwitcherTriggerNoOrganizations: `font-semibold text-sm hover:text-primary px-0 h-auto w-full justify-start ${isDarkMode ? "text-white" : ""}`,
                organizationSwitcherTriggerIcon: "text-muted-foreground"
              }
            }}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-2">
        {/* <p className="text-muted-foreground mb-2 mt-2 px-2 text-xs font-medium">
          Manufacturing
        </p> */}

        {manufacturingItems.map(item => {
          // Create a more precise active check
          const isActive =
            // Special case for root manufacturing page
            (item.href === "/manufacturing" &&
              (pathname === "/manufacturing" ||
                pathname === "/manufacturing/")) ||
            // Exact match for all other pages (not matching child pages)
            pathname === item.href

          return (
            <div key={item.title} className="mb-1">
              <div className="flex items-center">
                <Link
                  href={item.href}
                  className="flex flex-1 items-center py-0.5"
                  onClick={() => onNavigate(item.href)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`h-8 w-full justify-start gap-2 py-1 ${item.title === "Attainment" ? "hover:bg-primary/20 font-medium" : ""}`}
                  >
                    <item.icon
                      className={`size-4 ${item.title === "Attainment" ? "text-primary" : ""}`}
                    />
                    {item.title}
                    {loadingItem === item.href && (
                      <Loader2 className="text-muted-foreground ml-auto size-3 animate-spin" />
                    )}
                  </Button>
                </Link>
              </div>

              {item.isExpanded && item.children && item.children.length > 0 && (
                <div className="border-border ml-4 space-y-0 border-l pl-2">
                  {item.children.map(child => {
                    // Exact match for child items
                    const isChildActive = pathname === child.href
                    return (
                      <div key={child.title} className="mt-0.5">
                        <Link
                          href={child.href}
                          onClick={() => onNavigate(child.href)}
                        >
                          <Button
                            variant={isChildActive ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 w-full justify-start px-2 py-1 text-sm"
                          >
                            {child.icon && (
                              <child.icon className="mr-2 size-3.5" />
                            )}
                            {child.title}
                            {loadingItem === child.href && (
                              <Loader2 className="text-muted-foreground ml-auto size-3 animate-spin" />
                            )}
                          </Button>
                        </Link>

                        {child.children && child.children.length > 0 && (
                          <div className="border-border ml-4 space-y-0 border-l pl-2">
                            {child.children.map(grandchild => {
                              // Exact match for grandchild items
                              const isGrandchildActive =
                                pathname === grandchild.href
                              return (
                                <Link
                                  key={grandchild.title}
                                  href={grandchild.href}
                                  onClick={() => onNavigate(grandchild.href)}
                                >
                                  <Button
                                    variant={
                                      isGrandchildActive ? "secondary" : "ghost"
                                    }
                                    size="sm"
                                    className="mt-0.5 h-7 w-full justify-start px-2 py-1 text-sm"
                                  >
                                    {grandchild.icon && (
                                      <grandchild.icon className="mr-2 size-3.5" />
                                    )}
                                    {grandchild.title}
                                    {loadingItem === grandchild.href && (
                                      <Loader2 className="text-muted-foreground ml-auto size-3 animate-spin" />
                                    )}
                                  </Button>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* <p className="text-muted-foreground mb-2 mt-1 px-2 text-xs font-medium">
          Dashboard
        </p> */}

        {dashboardItems.map(item => {
          const isActive =
            (item.href === "/" && pathname === "/") || pathname === item.href

          return (
            <div key={item.title} className="mb-0.5">
              <div className="flex items-center">
                <Link
                  href={item.href}
                  className="flex flex-1 items-center py-2"
                  onClick={() => onNavigate(item.href)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 w-full justify-start gap-2 py-1"
                  >
                    <item.icon className="size-4" />
                    {item.title}
                    {loadingItem === item.href && (
                      <Loader2 className="text-muted-foreground ml-auto size-3 animate-spin" />
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex w-full items-center justify-between">
          <div
            className="hover:bg-accent/50 group relative flex flex-1 cursor-pointer items-center gap-3 rounded-md p-1 px-3 py-2"
            onClick={handleUserAreaClick}
          >
            <div ref={userBtnRef}>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  baseTheme: isDarkMode ? dark : undefined,
                  elements: {
                    userButtonTrigger: "focus:bg-transparent",
                    userButtonBox:
                      "after:absolute after:inset-0 after:w-full after:h-full" // Stretch clickable area
                  }
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="group-hover:text-primary truncate text-sm font-medium transition-colors">
                {user?.fullName || "User"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {user?.primaryEmailAddress?.emailAddress || "m@example.com"}
              </p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
