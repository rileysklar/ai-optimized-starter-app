"use client"

import { Button } from "@/components/ui/button"
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Github, ArrowRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export const CTASection = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="bg-muted/30 container mx-auto px-4 py-24">
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
          className="flex flex-col items-center justify-center text-center"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={cn(
              "mb-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            )}
          >
            <AnimatedGradientText>Ready for Production</AnimatedGradientText>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground mb-8 max-w-[700px] text-balance md:text-xl"
          >
            Get started with a complete stack including authentication,
            database, server actions, and deployment configuration. Includes a
            working contacts feature as a template for your own functionality.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            <Button asChild size="lg">
              <Link
                href="https://github.com/materialize-labs/ai-optimized-starter-app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <Github className="mr-2 size-4" />
                Clone from GitHub
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg">
              <Link
                href="https://rileysklar.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <ExternalLink className="mr-2 size-4" />
                Visit CellFlow
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
