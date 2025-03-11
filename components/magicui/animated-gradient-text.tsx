"use client"

import { ReactNode, useEffect, useState } from "react"

import { cn } from "@/lib/utils"

interface AnimatedGradientTextProps {
  children: ReactNode
  className?: string
}

export const AnimatedGradientText = ({
  children,
  className
}: AnimatedGradientTextProps) => {
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className={cn(
        mounted
          ? "from-primary bg-gradient-to-r via-purple-500 to-pink-600 bg-clip-text text-transparent"
          : "text-transparent",
        className
      )}
    >
      {mounted ? (
        <div className="animate-gradient-x from-primary h-20 bg-gradient-to-r via-purple-500 to-pink-600 bg-clip-text text-transparent">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
