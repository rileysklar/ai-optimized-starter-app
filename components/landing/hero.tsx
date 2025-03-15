/*
 * Hero section component with dynamic theme support.
 * Uses CSS variables defined in globals.css to ensure compatibility with both light and dark modes.
 * The gradient background uses theme-aware colors with slow, random movement.
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
  const [gradientPosition, setGradientPosition] = useState({ x: 50, y: 50 })
  const [gradientPositions, setGradientPositions] = useState<
    Array<{ x: number; y: number }>
  >([
    { x: 30, y: 70 },
    { x: 70, y: 30 }
  ])
  const heroRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const targetRef = useRef({ x: 50, y: 50 })

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  // Improved random gradient movement effect
  useEffect(() => {
    if (!mounted) return

    // Function to generate a random position within bounds with more natural constraints
    const generateRandomPosition = () => {
      // Get current position to ensure smooth transition
      const current = targetRef.current

      // Generate new position within a reasonable range from current
      // This creates more natural movement rather than jumping across the screen
      return {
        x: Math.max(10, Math.min(90, current.x + (Math.random() - 0.5) * 50)),
        y: Math.max(10, Math.min(90, current.y + (Math.random() - 0.5) * 50))
      }
    }

    // Function to update gradient position
    const animateGradients = () => {
      // Generate new targets when needed
      if (!targetRef.current) {
        targetRef.current = { x: 50, y: 50 }
      }

      // Slowly move toward the target position
      setGradientPosition(prev => {
        // Create smoother animation with variable speed (slower as it approaches target)
        const distance = Math.sqrt(
          Math.pow(targetRef.current.x - prev.x, 2) +
            Math.pow(targetRef.current.y - prev.y, 2)
        )

        // Adjust speed based on distance - slower when close, faster when far
        // Increased speed values for quicker movement
        const speed = Math.max(0.003, Math.min(0.015, distance * 0.001))

        // Calculate next position with dynamic speed
        const nextX = prev.x + (targetRef.current.x - prev.x) * speed
        const nextY = prev.y + (targetRef.current.y - prev.y) * speed

        // Check if we're close enough to the target to generate a new one
        // Increased threshold for more frequent position changes
        if (distance < 2) {
          // Generate a new target position
          targetRef.current = generateRandomPosition()

          // Also update trailing positions for a fluid effect
          setGradientPositions(current => {
            // Create new positions array with current as first, and shifting others
            return [
              { x: prev.x, y: prev.y },
              { x: current[0].x, y: current[0].y }
            ]
          })
        }

        return { x: nextX, y: nextY }
      })

      // Continue the animation loop
      animationRef.current = requestAnimationFrame(animateGradients)
    }

    // Start the animation
    animateGradients()

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mounted])

  return (
    <div
      ref={heroRef}
      className="relative mb-6 flex min-h-[60vh] flex-col items-center justify-start overflow-hidden px-4 pt-12 md:mb-8 md:pt-16"
    >
      {/* Grid background effect with improved animation transition */}
      <div
        ref={gridRef}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(
              circle at ${gradientPosition.x}% ${gradientPosition.y}%, 
              var(--highlight-gradient-from, rgba(62, 207, 142, 0.12)) 0%, 
              var(--highlight-gradient-to, rgba(62, 207, 142, 0.02)) 35%, 
              transparent 70%
            )
            ${
              gradientPositions[0]
                ? `, radial-gradient(
              circle at ${gradientPositions[0].x}% ${gradientPositions[0].y}%, 
              var(--highlight-gradient-from, rgba(62, 207, 142, 0.08)) 0%, 
              var(--highlight-gradient-to, rgba(62, 207, 142, 0.01)) 30%, 
              transparent 60%
            )`
                : ""
            }
            ${
              gradientPositions[1]
                ? `, radial-gradient(
              circle at ${gradientPositions[1].x}% ${gradientPositions[1].y}%, 
              var(--highlight-gradient-from, rgba(62, 207, 142, 0.04)) 0%, 
              var(--highlight-gradient-to, rgba(62, 207, 142, 0.005)) 25%, 
              transparent 50%
            )`
                : ""
            }
          `,
          backgroundSize: "100% 100%",
          transition: "background 1.5s cubic-bezier(0.22, 1, 0.36, 1)",
          maskImage: `radial-gradient(
            circle at 50% 50%, 
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
              linear-gradient(to right, var(--grid-line-color, rgba(98, 98, 98, 0.99)) 1px, transparent 1px),
              linear-gradient(to bottom, var(--grid-line-color, rgba(57, 57, 57, 0.76)) 1px, transparent 1px)
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
