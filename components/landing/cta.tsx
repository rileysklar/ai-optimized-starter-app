/*
 * CTA section component with dynamic theme support.
 * Uses CSS variables defined in globals.css to ensure compatibility with both light and dark modes.
 * Background gradients and button styles adapt to the current theme.
 */

"use client"

import { Button } from "@/components/ui/button"
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  ExternalLink,
  Github,
  BarChart,
  LineChart,
  Factory,
  Users,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export const CTASection = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="border-border bg-card/50 container relative mx-auto overflow-hidden rounded-lg border px-4 py-24 backdrop-blur-sm">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -inset-[10%] opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, var(--cta-gradient, rgba(62, 207, 142, 0.15)), transparent 70%)"
          }}
        />
      </div>

      {!mounted ? (
        // Placeholder while loading
        <div className="flex flex-col items-center justify-center">
          <div className="bg-muted mx-auto mb-8 h-10 w-96 animate-pulse rounded-md"></div>
          <div className="bg-muted mx-auto mb-8 h-6 w-80 animate-pulse rounded-md"></div>
          <div className="flex gap-4">
            <div className="bg-muted h-10 w-40 animate-pulse rounded-md"></div>
            <div className="bg-muted h-10 w-40 animate-pulse rounded-md"></div>
          </div>
        </div>
      ) : (
        // Actual content when mounted
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-col items-center justify-center text-center"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={cn(
              "mb-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            )}
          >
            <span className="text-foreground">Ready to optimize your</span>{" "}
            <span className="text-primary">production efficiency?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground mb-8 max-w-[700px] text-balance md:text-xl"
          >
            Start tracking your manufacturing efficiency today. Our system helps
            you identify bottlenecks, reduce downtime, and improve worker
            satisfaction through data-driven insights and worker-centric design.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 group font-medium"
            >
              <Link href="/manufacturing" className="flex items-center">
                <Factory className="mr-2 size-4" />
                Start Production Tracking
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

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
                <LineChart className="mr-2 size-4" />
                View Analytics Dashboard
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
