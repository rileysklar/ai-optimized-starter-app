/*
 * Footer section component with dynamic theme support.
 * Uses CSS variables defined in globals.css to ensure compatibility with both light and dark modes.
 * The mouse tracking effect and grid background use theme-aware gradient colors.
 */

"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export const FooterSection = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Only show theme toggle after component is mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <footer className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span>Built by</span>
            <Link
              href="https://rileysklar.io/"
              className="text-muted-foreground hover:text-primary"
            >
              Riley Sklar
            </Link>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hover:bg-muted rounded-full p-2"
            aria-label="Toggle theme"
          >
            {mounted &&
              (theme === "dark" ? (
                <Moon className="size-5" />
              ) : (
                <Sun className="size-5" />
              ))}
          </button>
        </div>
      </div>
    </footer>
  )
}
