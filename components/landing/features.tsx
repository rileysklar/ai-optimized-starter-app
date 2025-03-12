/*
 * Features section component with dynamic theme support.
 * Uses CSS variables defined in globals.css to ensure compatibility with both light and dark modes.
 * Feature cards use theme-aware colors and gradients for consistent appearance in different themes.
 */

"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  Code,
  Database,
  Zap,
  ShieldCheck,
  Layers,
  Paintbrush,
  Server,
  LayoutGrid,
  Terminal,
  BarChart,
  Clock,
  Activity,
  Bell,
  Award,
  Factory,
  LineChart
} from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface FeatureProps {
  title: string
  description: string
  icon: React.ElementType
}

const features: FeatureProps[] = [
  {
    title: "Real-Time Efficiency Tracking",
    description:
      "Monitor production efficiency in real-time with dynamic dashboards that update as machine cycles complete.",
    icon: Activity
  },
  {
    title: "Bottleneck Detection",
    description:
      "Automatically identify production bottlenecks and track cycle times to optimize your manufacturing process.",
    icon: BarChart
  },
  {
    title: "Worker-Centric Design",
    description:
      "Ergonomic break reminders, mental health check-ins, and feedback mechanisms to support worker wellbeing.",
    icon: Bell
  },
  {
    title: "Hierarchical Data Display",
    description:
      "View efficiency metrics at company, site, value stream, cell, and operator levels with interactive filters.",
    icon: Layers
  },
  {
    title: "Gamification Elements",
    description:
      "Boost engagement with points, achievements, and visual celebrations when production goals are met.",
    icon: Award
  },
  {
    title: "Comprehensive Analytics",
    description:
      "Visualize trends, export reports, and gain insights to continuously improve manufacturing processes.",
    icon: LineChart
  }
]

const FeatureCard = ({ title, description, icon: Icon }: FeatureProps) => {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -4
      }}
      className="border-border bg-card/50 hover:border-primary/30 hover:bg-card group relative rounded-lg border p-6 backdrop-blur-sm transition-colors"
    >
      <div className="flex flex-col items-start">
        <div className="bg-muted group-hover:bg-primary/10 mb-4 rounded-full p-3 transition-colors">
          <Icon className="text-primary size-6" />
        </div>

        <h3 className="text-foreground mb-2 text-xl font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {/* Subtle corner accent */}
      <div
        className="absolute right-3 top-3 size-8 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(to bottom right, var(--accent-gradient-from, rgba(62, 207, 142, 0.1)), var(--accent-gradient-to, rgba(62, 207, 142, 0.05)))",
          opacity: 0,
          transition: "opacity 0.3s ease-out"
        }}
      ></div>
    </motion.div>
  )
}

export const FeaturesSection = () => {
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="container mx-auto px-4 pb-24 pt-12">
      {!mounted ? (
        // Placeholder while loading
        <>
          <div className="mb-12 text-center">
            <div className="bg-muted mx-auto mb-2 h-10 w-64 animate-pulse rounded-md"></div>
            <div className="bg-muted mx-auto h-6 w-96 animate-pulse rounded-md"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-muted h-40 animate-pulse rounded-lg"
              ></div>
            ))}
          </div>
        </>
      ) : (
        // Actual content when mounted
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="text-foreground">Powerful features for</span>{" "}
              <span className="text-primary">manufacturing excellence</span>
            </h2>
            <p className="text-muted-foreground mx-auto max-w-[800px]">
              Our platform provides comprehensive tools to track, analyze, and
              optimize your manufacturing processes with a focus on efficiency
              and worker wellbeing.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
