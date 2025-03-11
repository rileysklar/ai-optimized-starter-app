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
        backgroundPosition: "100% 50%"
      }}
      initial={{ backgroundPosition: "0% 50%" }}
      transition={{
        backgroundPosition: {
          duration: 0.5,
          ease: "easeInOut"
        }
      }}
      className="group relative overflow-hidden rounded-lg p-[2px] shadow-sm hover:shadow-md"
      style={{
        background:
          "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)",
        backgroundSize: "200% 100%"
      }}
    >
      <div className="bg-card flex h-full flex-col items-center rounded-lg p-6 text-center">
        <div className="bg-primary/10 mb-4 rounded-full from-blue-500 via-purple-500 to-pink-500 p-3 transition-all duration-300 group-hover:bg-gradient-to-r">
          <Icon className="text-primary size-6 transition-all duration-300 group-hover:text-white" />
        </div>
        <h3 className="mb-2 text-xl font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
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
    <div className="container mx-auto px-4 pb-8 pt-0">
      {!mounted ? (
        // Placeholder while loading
        <>
          <div className="mb-6 text-center">
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
