"use server"

import { getEfficiencyMetricsAction } from "@/actions/db/efficiency-metrics-actions"
import { getBottleneckAnalysisAction } from "@/actions/db/bottleneck-analysis-actions"
import { getCellsAction } from "@/actions/db/cells-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { EfficiencyDashboard } from "../_components/efficiency-dashboard"
import { MetricsSkeleton } from "../_components/metrics-skeleton"

export const metadata = {
  title: "Efficiency Metrics | Manufacturing",
  description: "View production efficiency metrics and bottleneck analysis"
}

export default async function MetricsPage() {
  const { userId } = await auth()

  if (!userId) {
    return redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Efficiency Metrics</h1>
      </div>

      <p className="text-muted-foreground">
        Monitor production efficiency metrics, bottleneck analysis, and
        production performance over time. Use these insights to optimize
        manufacturing processes and improve overall efficiency.
      </p>

      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsContent userId={userId} />
      </Suspense>
    </div>
  )
}

async function MetricsContent({ userId }: { userId: string }) {
  // Fetch metrics data
  const { data: cells } = await getCellsAction()
  const { data: metrics } = await getEfficiencyMetricsAction()
  const { data: bottlenecks } = await getBottleneckAnalysisAction()

  return (
    <EfficiencyDashboard
      userId={userId}
      initialCells={cells || []}
      initialMetrics={metrics || []}
      initialBottlenecks={bottlenecks || []}
    />
  )
}
