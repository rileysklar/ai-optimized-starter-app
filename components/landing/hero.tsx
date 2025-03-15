/*
 * Hero section component with dynamic theme support.
 * Uses CSS variables defined in globals.css to ensure compatibility with both light and dark modes.
 * The mouse tracking effect and grid background use theme-aware gradient colors.
 */

"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/app/manufacturing/lib/utils"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Github,
  Code,
  Factory,
  BarChart,
  LineChart
} from "lucide-react"
import Link from "next/link"
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs"
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text"
import { useEffect, useState, useRef } from "react"

export const HeroSection = () => {
  const [mounted, setMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [trailingPositions, setTrailingPositions] = useState<
    Array<{ x: number; y: number }>
  >([])
  const heroRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  // Mouse tracking effect
  useEffect(() => {
    if (!mounted) return

    let animationFrameId: number
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return

      const rect = heroRef.current.getBoundingClientRect()
      targetX = ((e.clientX - rect.left) / rect.width) * 100
      targetY = ((e.clientY - rect.top) / rect.height) * 100
    }

    const animateMousePosition = () => {
      // Interpolate current position towards target (lagging effect)
      const currentX = mousePosition.x + (targetX - mousePosition.x) * 0.02
      const currentY = mousePosition.y + (targetY - mousePosition.y) * 0.02

      // Only update if there's a significant change
      if (
        Math.abs(currentX - mousePosition.x) > 0.01 ||
        Math.abs(currentY - mousePosition.y) > 0.01
      ) {
        // Update trailing positions
        setTrailingPositions(prev => {
          const newPositions = [...prev]
          // Add current position to the beginning
          newPositions.unshift({ x: currentX, y: currentY })
          // Keep only the last 3 positions
          return newPositions.slice(0, 3)
        })

        setMousePosition({ x: currentX, y: currentY })
      }

      animationFrameId = requestAnimationFrame(animateMousePosition)
    }

    // Start animation
    animationFrameId = requestAnimationFrame(animateMousePosition)

    // Add event listener
    window.addEventListener("mousemove", handleMouseMove)

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [mounted, mousePosition])

  return (
    <div
      ref={heroRef}
      className="relative mb-6 flex min-h-[60vh] flex-col items-center justify-start overflow-hidden px-4 pt-12 md:mb-8 md:pt-16"
    >
      {/* Grid background effect */}
      <div
        ref={gridRef}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(
              circle at ${mousePosition.x}% ${mousePosition.y}%, 
              var(--highlight-gradient-from, rgba(62, 207, 142, 0.12)) 0%, 
              var(--highlight-gradient-to, rgba(62, 207, 142, 0.02)) 35%, 
              transparent 70%
            )
            ${
              trailingPositions[0]
                ? `, radial-gradient(
              circle at ${trailingPositions[0].x}% ${trailingPositions[0].y}%, 
              var(--highlight-gradient-from, rgba(62, 207, 142, 0.08)) 0%, 
              var(--highlight-gradient-to, rgba(62, 207, 142, 0.01)) 30%, 
              transparent 60%
            )`
                : ""
            }
            ${
              trailingPositions[1]
                ? `, radial-gradient(
              circle at ${trailingPositions[1].x}% ${trailingPositions[1].y}%, 
              var(--highlight-gradient-from, rgba(62, 207, 142, 0.04)) 0%, 
              var(--highlight-gradient-to, rgba(62, 207, 142, 0.005)) 25%, 
              transparent 50%
            )`
                : ""
            }
          `,
          backgroundSize: "100% 100%",
          transition: "background 0.5s ease-out, mask-image 0.5s ease-out",
          maskImage: `radial-gradient(
            circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(0, 0, 0, 1) 0%, 
            rgba(0, 0, 0, 0.8) 45%, 
            rgba(0, 0, 0, 0.5) 65%, 
            rgba(0, 0, 0, 0) 100%
          )`,
          maskSize: "200% 200%"
        }}
      >
        {/* Grid lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--grid-line-color, rgba(62, 207, 142, 0.03)) 1px, transparent 1px),
              linear-gradient(to bottom, var(--grid-line-color, rgba(62, 207, 142, 0.03)) 1px, transparent 1px)
            `,
            backgroundSize: "clamp(20px, 5vw, 40px) clamp(20px, 5vw, 40px)"
          }}
        />
      </div>

      {!mounted ? (
        // Placeholder while loading - updated to match actual content
        <>
          <div className="bg-muted mb-4 h-8 w-48 animate-pulse rounded-md"></div>
          <div className="bg-muted mb-4 h-12 w-64 animate-pulse rounded-md"></div>
          <div className="bg-muted mb-8 h-4 w-48 animate-pulse rounded-md"></div>
          <div className="flex gap-4">
            <div className="bg-muted h-10 w-40 animate-pulse rounded-md"></div>
            <div className="bg-muted h-10 w-40 animate-pulse rounded-md"></div>
          </div>
        </>
      ) : (
        // Actual content when mounted
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="z-10 mb-4"
          >
            <Link
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-card/50 text-muted-foreground group inline-flex items-center rounded-full border px-3 py-2 text-sm leading-none no-underline backdrop-blur-sm"
            >
              <Factory className="text-primary mr-1 size-3.5" />
              <span className="mr-1">Manufacturing Efficiency</span>
              <span className="text-primary block transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="z-10 mb-4 text-center"
          >
            <h1
              className={cn(
                "text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
              )}
            >
              <span className="text-foreground block">Track progress</span>
              <span className="text-primary block">Reward success</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground z-10 mb-8 max-w-[700px] text-balance text-center md:text-xl"
          >
            Track and optimize production efficiency in real-time. Log machine
            cycles, identify bottlenecks, measure cycle times, and dynamically
            adjust production standards.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="z-10 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            {/* Conditional rendering based on authentication state */}
            <SignedIn>
              {/* Show direct link to manufacturing for signed-in users */}
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 group font-medium"
              >
                <Link href="/manufacturing" className="flex items-center">
                  Start Tracking{" "}
                  <ArrowRight className="ml-2 size-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </SignedIn>

            <SignedOut>
              {/* Redirect to sign-in with redirect_url for signed-out users */}
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 group font-medium"
              >
                <Link
                  href="/login?redirect_url=/manufacturing"
                  className="flex items-center"
                >
                  Start Tracking{" "}
                  <ArrowRight className="ml-2 size-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </SignedOut>

            {/* View Analytics button - conditionally rendered */}
            <SignedIn>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-border bg-card/50 hover:bg-card hover:text-primary group backdrop-blur-sm"
              >
                <Link
                  href="/manufacturing/analytics"
                  className="flex items-center"
                >
                  View Analytics{" "}
                  <LineChart className="ml-2 size-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </SignedIn>

            <SignedOut>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-border bg-card/50 hover:bg-card hover:text-primary group backdrop-blur-sm"
              >
                <Link
                  href="/login?redirect_url=/manufacturing/analytics"
                  className="flex items-center"
                >
                  View Analytics{" "}
                  <LineChart className="ml-2 size-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </SignedOut>
          </motion.div>
        </>
      )}
    </div>
  )
}
