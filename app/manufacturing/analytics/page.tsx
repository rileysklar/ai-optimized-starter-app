"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCellsAction } from "@/actions/db/cells-actions"
import { getValueStreamsAction } from "@/actions/db/value-streams-actions"
import { getEfficiencyMetricsAction } from "@/actions/db/efficiency-metrics-actions"
import { getBottleneckAnalysisAction } from "@/actions/db/bottleneck-analysis-actions"
import { getAggregatedEfficiencyMetricsAction } from "@/actions/db/efficiency-metrics-actions"
import { getProductionLogsByDateRangeAction } from "@/actions/db/production-logs-actions"
import { format, subDays, startOfDay, parse } from "date-fns"
import { EfficiencyDashboard } from "./_components/efficiency-dashboard"
import { BottleneckAnalysisDashboard } from "./_components/bottleneck-analysis-dashboard"
import { ProductionTrendsChart } from "./_components/production-trends-chart"
import { DateRangeSelector } from "./_components/date-range-selector"
import { HierarchySelector } from "./_components/hierarchy-selector"
import { AnalyticsSkeleton } from "./_components/analytics-skeleton"
import { BatchMetricsCalculator } from "../_components/batch-metrics-calculator"
import { SelectCell, SelectValueStream } from "@/db/schema"
import { SelectEfficiencyMetric } from "@/db/schema/metrics-schema"
import { SelectBottleneckAnalysis } from "@/db/schema/metrics-schema"
import { FixAttainmentData } from "../_components/fix-attainment-data"

// Replace direct metadata export with generateMetadata function
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Analytics | Manufacturing",
    description: "Manufacturing efficiency analytics and insights"
  }
}

// Define the search params interface
interface AnalyticsSearchParams {
  cellId?: string
  valueStreamId?: string
  startDate?: string
  endDate?: string
}

// Use any type for now to get the build passing
export default async function AnalyticsPage({ searchParams }: any) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  // Convert searchParams to our typed interface
  const typedParams: AnalyticsSearchParams = {
    cellId:
      typeof searchParams.cellId === "string" ? searchParams.cellId : undefined,
    valueStreamId:
      typeof searchParams.valueStreamId === "string"
        ? searchParams.valueStreamId
        : undefined,
    startDate:
      typeof searchParams.startDate === "string"
        ? searchParams.startDate
        : undefined,
    endDate:
      typeof searchParams.endDate === "string"
        ? searchParams.endDate
        : undefined
  }

  // All data will be fetched in the AnalyticsContent component
  return (
    <div className="container py-6">
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent userId={userId} searchParams={typedParams} />
      </Suspense>
    </div>
  )
}

async function AnalyticsContent({
  userId,
  searchParams
}: {
  userId: string
  searchParams: AnalyticsSearchParams
}) {
  // Get parameters from URL or use defaults
  const {
    cellId: cellIdParam,
    valueStreamId,
    startDate: startDateParam,
    endDate: endDateParam
  } = searchParams

  // Fetch cells for hierarchy selection
  const cellsResult = await getCellsAction()
  const cells: SelectCell[] = cellsResult.isSuccess ? cellsResult.data : []

  // Fetch value streams for hierarchy selection
  const valueStreamsResult = await getValueStreamsAction()
  const valueStreams: SelectValueStream[] = valueStreamsResult.isSuccess
    ? valueStreamsResult.data
    : []

  // Filter cells by value stream if specified
  const filteredCells = valueStreamId
    ? cells.filter(cell => cell.valueStreamId === valueStreamId)
    : cells

  // Set default cell if available
  let defaultCell = null

  // Try to use the cell from URL parameters first
  if (cellIdParam) {
    defaultCell = cells.find(cell => cell.id === cellIdParam) || null
  }

  // If no cell from URL or cell not found, use first cell from filtered list
  if (!defaultCell && filteredCells.length > 0) {
    defaultCell = filteredCells[0]
  }

  // If still no cell, use first cell from all cells
  if (!defaultCell && cells.length > 0) {
    defaultCell = cells[0]
  }

  const defaultCellId = defaultCell?.id || ""
  const defaultCellName = defaultCell?.name || "No cells available"

  // Parse dates or use defaults (last 7 days)
  const today = new Date()
  const sevenDaysAgo = subDays(today, 7)

  // Set default date range (validate and parse input dates)
  const isValidDateString = (dateStr?: string) => {
    if (!dateStr) return false
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
  }

  const parseDate = (dateStr: string, defaultDate: Date) => {
    try {
      if (isValidDateString(dateStr)) {
        return parse(dateStr, "yyyy-MM-dd", new Date())
      }
      return defaultDate
    } catch (error) {
      return defaultDate
    }
  }

  const startDate = startDateParam
    ? parseDate(startDateParam, sevenDaysAgo)
    : sevenDaysAgo

  const endDate = endDateParam ? parseDate(endDateParam, today) : today

  const startDateStr = format(startOfDay(startDate), "yyyy-MM-dd")
  const endDateStr = format(startOfDay(endDate), "yyyy-MM-dd")

  // Only fetch data if we have a valid cell
  let efficiencyMetrics: SelectEfficiencyMetric[] = []
  let bottleneckAnalyses: SelectBottleneckAnalysis[] = []
  let productionLogs: any[] = []
  let aggregatedMetrics: any = null

  if (defaultCellId) {
    // Fetch efficiency metrics for the selected cell and date range
    const metricsResult = await getEfficiencyMetricsAction(
      defaultCellId,
      startDateStr,
      endDateStr
    )

    if (metricsResult.isSuccess) {
      efficiencyMetrics = metricsResult.data
    }

    // Fetch bottleneck analyses for the selected cell and date range
    const bottleneckResult = await getBottleneckAnalysisAction({
      cellId: defaultCellId,
      startDate: startDateStr,
      endDate: endDateStr
    })

    if (bottleneckResult.isSuccess) {
      bottleneckAnalyses = bottleneckResult.data
    }

    // Fetch production logs for the selected cell and date range
    const logsResult = await getProductionLogsByDateRangeAction(
      defaultCellId,
      startDateStr,
      endDateStr
    )

    if (logsResult.isSuccess) {
      productionLogs = logsResult.data
    }

    // Fetch aggregated metrics for the selected cell (last 30 days)
    const aggregatedResult = await getAggregatedEfficiencyMetricsAction({
      cellId: defaultCellId,
      period: "month"
    })

    if (aggregatedResult.isSuccess) {
      aggregatedMetrics = aggregatedResult.data
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manufacturing efficiency metrics and bottleneck analysis
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Filters & Time Range
            </CardTitle>
            <CardDescription>
              Select value stream, cell, and date range to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <HierarchySelector
                cells={cells}
                valueStreams={valueStreams}
                defaultCellId={defaultCellId}
              />

              <DateRangeSelector
                defaultStartDate={startDateStr}
                defaultEndDate={endDateStr}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aggregatedMetrics?.avgEfficiency?.toFixed(1) ?? "N/A"}%
                </div>
                <p className="text-muted-foreground text-xs">
                  Average efficiency over the last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Attainment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aggregatedMetrics?.avgAttainment?.toFixed(1) ?? "N/A"}%
                </div>
                <p className="text-muted-foreground text-xs">
                  Average attainment over the last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Parts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aggregatedMetrics?.totalParts?.toLocaleString() || 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  Total parts produced in the last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Downtime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aggregatedMetrics?.totalDowntime
                    ? Math.round(aggregatedMetrics.totalDowntime / 3600)
                    : 0}{" "}
                  hrs
                </div>
                <p className="text-muted-foreground text-xs">
                  Total downtime over the last 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Production Trends</CardTitle>
                <CardDescription>
                  Weekly production volume and efficiency trends
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ProductionTrendsChart data={efficiencyMetrics} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Maintenance</CardTitle>
                <CardDescription>
                  Calculate and fix metrics from production data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium">
                    Calculate Missing Metrics
                  </h3>
                  <BatchMetricsCalculator cellId={defaultCellId} />
                </div>
                <div className="border-t pt-4">
                  <h3 className="mb-2 text-sm font-medium">
                    Fix Attainment Data
                  </h3>
                  <FixAttainmentData
                    cellId={defaultCellId}
                    startDate={startDateStr}
                    endDate={endDateStr}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Analysis</CardTitle>
              <CardDescription>
                Detailed efficiency metrics for {defaultCellName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EfficiencyDashboard
                metrics={efficiencyMetrics}
                cellId={defaultCellId}
                cellName={defaultCellName}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bottleneck Analysis</CardTitle>
              <CardDescription>
                Detected bottlenecks and their impact on production
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BottleneckAnalysisDashboard
                bottlenecks={bottleneckAnalyses}
                cellId={defaultCellId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Trends</CardTitle>
              <CardDescription>
                Historical trends and performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <ProductionTrendsChart
                data={efficiencyMetrics}
                showDetails={true}
                productionLogs={productionLogs}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
