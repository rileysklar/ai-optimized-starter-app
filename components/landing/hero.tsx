"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ArrowRight, Github, Code } from "lucide-react"
import Link from "next/link"
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text"
import { useEffect, useState } from "react"

export const HeroSection = () => {
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="mb-6 flex min-h-[30vh] flex-col items-center justify-start px-4 pt-12 md:mb-8 md:pt-16">
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
            className="mb-4"
          >
            <Link
              href="https://github.com/materialize-labs/ai-optimized-starter-app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground group inline-flex items-center rounded-full border px-3 py-1 text-sm leading-none no-underline"
            >
              <Github className="mr-1 size-3.5" />
              <span className="mr-1">Available on GitHub</span>
              <span className="block transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 text-center"
          >
            <h1
              className={cn(
                "text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
              )}
            >
              <AnimatedGradientText>
                AI Optimized Starter App
              </AnimatedGradientText>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground mb-4 max-w-[700px] text-balance text-center md:text-xl"
          >
            A production-ready full-stack web application template optimized for
            AI-assisted development with Next.js, Tailwind, Clerk Auth,
            Supabase, and Drizzle ORM.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            <Button asChild size="lg" className="group">
              <Link href="/contacts" className="flex items-center">
                Get Started{" "}
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="group">
              <Link
                href="https://materializelabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                By CellFlow{" "}
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </>
      )}
    </div>
  )
}
