import { getEfficiencyMetricsAction } from "@/actions/db/efficiency-metrics-actions"
import { getBottleneckAnalysisAction } from "@/actions/db/bottleneck-analysis-actions"
import { getCellsAction } from "@/actions/db/cells-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import EfficiencyDashboard from "../_components/efficiency-dashboard"
import { MetricsSkeleton } from "../_components/metrics-skeleton"
import { SelectEfficiencyMetric } from "@/db/schema/metrics-schema"
import { SelectBottleneckAnalysis } from "@/db/schema/metrics-schema"

// Define adapter interfaces matching the component expectations
interface EfficiencyMetricForComponent {
  id: string
  cellId: string | null
  date: string
  efficiency: number
  attainmentPercentage?: number | string
  lossPercentage: number
  totalLossMinutes: number
  totalBreakMinutes: number
  totalCycleTime: number
  standardCycleTime: number
  totalDowntime?: number
  totalRuntime?: number
  downtimeMinutes?: string | number
}

interface BottleneckAnalysisForComponent {
  id: string
  cellId: string
  date: string
  bottleneckMachineId: string
  bottleneckPercentage: number
  impactMinutes: number
  recommendedAction: string
}

// Adapter functions to convert DB records to component-compatible format
function adaptMetric(
  metric: SelectEfficiencyMetric
): EfficiencyMetricForComponent {
  return {
    id: metric.id,
    cellId: metric.cellId,
    date: metric.date,
    efficiency:
      typeof metric.efficiency === "string"
        ? parseFloat(metric.efficiency)
        : metric.efficiency || 0,
    attainmentPercentage: metric.attainmentPercentage || undefined,
    // Provide default values for missing properties
    lossPercentage: 0,
    totalLossMinutes: 0,
    totalBreakMinutes: 0,
    totalCycleTime: 0,
    standardCycleTime: 0,
    totalDowntime: metric.totalDowntime || 0,
    totalRuntime: metric.totalRuntime || 0,
    downtimeMinutes: metric.downtimeMinutes ?? undefined
  }
}

function adaptBottleneck(
  bottleneck: SelectBottleneckAnalysis
): BottleneckAnalysisForComponent {
  return {
    id: bottleneck.id,
    cellId: bottleneck.cellId,
    date: bottleneck.date,
    bottleneckMachineId: bottleneck.bottleneckMachineId || "",
    // Provide default values for missing properties
    bottleneckPercentage: 0,
    impactMinutes: 0,
    recommendedAction: bottleneck.notes || ""
  }
}

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
  // Get today's date and 30 days ago for default date range
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const todayStr = today.toISOString().split("T")[0]
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0]

  // Fetch cells and pick the first one as default if available
  const cellsResult = await getCellsAction()
  const cells = cellsResult.isSuccess ? cellsResult.data : []
  const defaultCellId = cells.length > 0 ? cells[0].id : ""

  // Only fetch metrics if we have a valid cell
  let metrics: EfficiencyMetricForComponent[] = []
  let bottlenecks: BottleneckAnalysisForComponent[] = []

  if (defaultCellId) {
    // Fetch efficiency metrics with proper parameters
    const metricsResult = await getEfficiencyMetricsAction(
      defaultCellId,
      thirtyDaysAgoStr,
      todayStr
    )

    // Convert DB metrics to component-compatible format
    if (metricsResult.isSuccess && metricsResult.data) {
      metrics = metricsResult.data.map(adaptMetric)
    }

    // Fetch bottleneck analyses with proper parameters
    const bottleneckResult = await getBottleneckAnalysisAction({
      cellId: defaultCellId,
      startDate: thirtyDaysAgoStr,
      endDate: todayStr
    })

    // Convert DB bottlenecks to component-compatible format
    if (bottleneckResult.isSuccess && bottleneckResult.data) {
      bottlenecks = bottleneckResult.data.map(adaptBottleneck)
    }
  }

  return (
    <EfficiencyDashboard
      userId={userId}
      initialCells={cells || []}
      initialMetrics={metrics}
      initialBottlenecks={bottlenecks}
    />
  )
}
