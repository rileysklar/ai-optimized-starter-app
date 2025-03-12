import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import EfficiencyDashboard from "@/app/manufacturing/_components/efficiency-dashboard"
import { getCellsAction } from "@/actions/db/cells-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ManufacturingNavbar } from "@/app/manufacturing/_components/manufacturing-navbar"
import { getEfficiencyMetricsAction } from "@/actions/db/efficiency-metrics-actions"
import { getBottleneckAnalysisAction } from "@/actions/db/bottleneck-analysis-actions"
import { BatchMetricsCalculator } from "@/app/manufacturing/_components/batch-metrics-calculator"

// Define basic types for our metrics and bottlenecks
interface BasicMetric {
  id: string
  cellId: string
  date: string
  efficiency: number
  attainmentPercentage?: number
  lossPercentage: number
  totalLossMinutes: number
  totalBreakMinutes: number
  totalCycleTime: number
  standardCycleTime: number
  totalDowntime?: number
  totalRuntime?: number
  downtimeMinutes?: string | number
}

interface BasicBottleneck {
  id: string
  cellId: string
  date: string
  bottleneckMachineId: string
  bottleneckPercentage: number
  impactMinutes: number
  recommendedAction: string
}

interface CellType {
  id: string
  name: string
  valueStreamId: string
}

export const metadata = {
  title: "Analytics | Manufacturing",
  description: "Manufacturing efficiency analytics and insights"
}

// Skeleton component for the analytics dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded bg-gray-200"></div>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded bg-gray-200"></div>
        ))}
      </div>
    </div>
  )
}

export default async function AnalyticsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  // Get default cell ID from the first available cell
  let defaultCell = ""
  try {
    const cellsResult = await getCellsAction()
    if (
      cellsResult.isSuccess &&
      cellsResult.data &&
      cellsResult.data.length > 0
    ) {
      defaultCell = cellsResult.data[0].id
    }
  } catch (error) {
    console.error("Error fetching default cell:", error)
  }

  return (
    <div>
      <div className="container py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Suspense fallback={<DashboardSkeleton />}>
              <AnalyticsContent userId={userId} />
            </Suspense>
          </div>

          {defaultCell && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Utilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <BatchMetricsCalculator cellId={defaultCell} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

async function AnalyticsContent({ userId }: { userId: string }) {
  // Initialize empty arrays for metrics and bottlenecks
  let cells: CellType[] = []
  let initialMetrics: BasicMetric[] = []
  let initialBottlenecks: BasicBottleneck[] = []

  try {
    // Get all cells
    const cellsResult = await getCellsAction()
    if (cellsResult.isSuccess && cellsResult.data) {
      cells = cellsResult.data
    }

    // If there are no cells, return early
    if (cells.length === 0) {
      return (
        <div className="bg-muted mt-4 rounded-md p-4">
          <p>No cells found. Please create a cell first.</p>
        </div>
      )
    }

    // Use the first cell as default
    const defaultCell = cells[0].id

    // Get date range for the past 7 days
    const today = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(today.getDate() - 7)

    const todayStr = today.toISOString().split("T")[0]
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]

    // Fetch efficiency metrics from the API
    console.log(
      `Getting efficiency metrics for cell: ${defaultCell} from ${sevenDaysAgoStr} to ${todayStr}`
    )
    const metricsResult = await getEfficiencyMetricsAction({
      cellId: defaultCell,
      startDate: sevenDaysAgoStr,
      endDate: todayStr
    })

    if (
      metricsResult.isSuccess &&
      metricsResult.data &&
      metricsResult.data.length > 0
    ) {
      console.log(
        `Successfully retrieved ${metricsResult.data.length} efficiency metrics`
      )
      initialMetrics = metricsResult.data.map(metric => ({
        id: metric.id,
        cellId: metric.cellId,
        date: metric.date,
        // Map existing fields from the database to our expected format
        efficiency:
          typeof metric.efficiency === "number"
            ? metric.efficiency
            : typeof metric.efficiency === "string"
              ? parseFloat(metric.efficiency)
              : 0,
        // Default value for fields that might not exist in the DB
        attainmentPercentage:
          metric.attainmentPercentage ||
          (typeof metric.efficiency === "number"
            ? metric.efficiency
            : typeof metric.efficiency === "string"
              ? parseFloat(metric.efficiency)
              : 0),
        lossPercentage:
          100 -
          (metric.attainmentPercentage ||
            (typeof metric.efficiency === "number"
              ? metric.efficiency
              : typeof metric.efficiency === "string"
                ? parseFloat(metric.efficiency)
                : 0)),
        totalLossMinutes: metric.downtimeMinutes
          ? parseFloat(metric.downtimeMinutes as string)
          : metric.totalDowntime
            ? Math.round(metric.totalDowntime / 60)
            : 0,
        totalBreakMinutes: 30, // Default break time
        totalCycleTime: metric.totalRuntime || 0,
        standardCycleTime: 480 * 60 // 8 hours in seconds
      }))
    } else {
      // No metrics found, leaving initialMetrics as empty array
      console.log("No efficiency metrics found in database")
    }

    // Fetch actual bottleneck data from the database
    console.log("Fetching bottleneck analysis data from database")
    const bottlenecksResult = await getBottleneckAnalysisAction({
      cellId: defaultCell,
      startDate: sevenDaysAgoStr,
      endDate: todayStr
    })

    if (
      bottlenecksResult.isSuccess &&
      bottlenecksResult.data &&
      bottlenecksResult.data.length > 0
    ) {
      console.log(
        `Successfully retrieved ${bottlenecksResult.data.length} bottleneck analyses`
      )
      initialBottlenecks = bottlenecksResult.data.map(b => ({
        id: b.id,
        cellId: b.cellId,
        date: b.date,
        bottleneckMachineId: b.bottleneckMachineId || `machine-1`,
        bottleneckPercentage: b.bottleneckSeverity
          ? parseFloat(b.bottleneckSeverity.toString())
          : 0,
        impactMinutes: b.bottleneckSeverity
          ? Math.round(parseFloat(b.bottleneckSeverity.toString()) * 4.8)
          : 0,
        recommendedAction: b.notes || "Review machine performance"
      }))
    } else {
      console.log("No bottleneck analysis data found in database")
    }

    console.log(
      `Loaded ${initialMetrics.length} metrics and ${initialBottlenecks.length} bottlenecks for dashboard`
    )
  } catch (error) {
    console.error("Error preparing analytics data:", error)
    // Show empty state with error handling in the UI
    return (
      <div className="bg-destructive/10 mt-4 rounded-md p-4">
        <p>Error loading analytics data. Please try again later.</p>
      </div>
    )
  }

  return (
    <EfficiencyDashboard
      userId={userId}
      initialCells={cells}
      initialMetrics={initialMetrics}
      initialBottlenecks={initialBottlenecks}
    />
  )
}
