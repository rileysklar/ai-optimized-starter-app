"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { EfficiencyDashboard } from "@/app/manufacturing/_components/efficiency-dashboard"
import { getCellsAction } from "@/actions/db/cells-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ManufacturingNavbar } from "@/app/manufacturing/_components/manufacturing-navbar"

export const metadata = {
  title: "Analytics | Manufacturing",
  description: "Manufacturing efficiency analytics and insights"
}

export default async function AnalyticsPage() {
  const { userId } = await auth()

  if (!userId) {
    return redirect("/login")
  }

  return (
    <div className="container py-6">
      <h1 className="mb-4 text-3xl font-bold">Manufacturing</h1>
      <ManufacturingNavbar />

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent userId={userId} />
      </Suspense>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-[240px]" />
        <Skeleton className="ml-auto h-10 w-32" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-8 w-full max-w-md" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="h-80">
              <Skeleton className="size-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="h-80">
              <Skeleton className="size-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

async function AnalyticsContent({ userId }: { userId: string }) {
  // Fetch cells data for the dashboard
  const { data: cells } = await getCellsAction()

  // Define types for the metrics and bottlenecks
  interface EfficiencyMetric {
    id: string
    machineId: string
    cellId: string
    date: string
    totalCycleTime: number
    standardCycleTime: number
    totalDowntime: number
    totalLossMinutes: number
    totalBreakMinutes: number
    lossPercentage: number
    attainmentPercentage: number
  }

  interface BottleneckAnalysis {
    id: string
    cellId: string
    date: string
    bottleneckMachineId: string
    bottleneckPercentage: number
    impactMinutes: number
    recommendedAction: string
  }

  // For initial implementation, we'll use empty arrays for metrics and bottlenecks
  // In a real app, we would fetch this data based on default parameters
  const initialMetrics: EfficiencyMetric[] = []
  const initialBottlenecks: BottleneckAnalysis[] = []

  return (
    <EfficiencyDashboard
      userId={userId}
      initialCells={cells || []}
      initialMetrics={initialMetrics}
      initialBottlenecks={initialBottlenecks}
    />
  )
}
