"use client"

import { Button } from "@/components/ui/button"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { Menu, Rocket, X, Factory } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ThemeSwitcher } from "./utilities/theme-switcher"
import { useTheme } from "next-themes"

interface NavLink {
  href: string
  label: string
}

const navLinks: NavLink[] = []

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        isScrolled
          ? "bg-background/80 shadow-sm backdrop-blur-sm"
          : "bg-background"
      }`}
    >
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between p-4">
        <div className="flex items-center space-x-2 hover:cursor-pointer hover:opacity-80">
          <Link href="/" className="flex items-center text-xl font-bold">
            <Factory className="mr-2 size-4" />
            CellFlow
          </Link>
        </div>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 space-x-2 font-semibold md:flex">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1 hover:opacity-80"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {/* Display these on desktop only */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <ThemeSwitcher />

            <SignedIn>
              <Link href="/manufacturing">
                <Button className="gap-2">
                  <Rocket className="size-4" />
                  Go to App
                </Button>
              </Link>
            </SignedIn>
          </div>

          <SignedOut>
            <SignInButton>
              <Button variant="outline">Login</Button>
            </SignInButton>

            <SignUpButton>
              <Button className="bg-primary hover:bg-primary/80">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                baseTheme: isDarkMode ? dark : undefined,
                elements: {
                  userButtonTrigger: "hover:bg-transparent focus:bg-transparent"
                }
              }}
            />
          </SignedIn>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="bg-background border-b p-4 md:hidden">
          <div className="space-y-4">
            <SignedIn>
              <div>
                <Link
                  href="/contacts"
                  className="text-foreground/80 hover:text-foreground block py-2 text-sm font-medium"
                  onClick={toggleMenu}
                >
                  Go to App
                </Link>
              </div>
            </SignedIn>
            <div>
              <ThemeSwitcher />
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
