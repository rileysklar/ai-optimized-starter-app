"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle } from "lucide-react"
import { getEfficiencyMetricsAction } from "@/actions/db/efficiency-metrics-actions"
import { getBottleneckAnalysisAction } from "@/actions/db/bottleneck-analysis-actions"
import { getMachinesByCellIdAction } from "@/actions/db/machines-actions"
import { BottleneckDialog } from "./bottleneck-dialog"
import { CalculateMissingMetrics } from "./calculate-missing-metrics"
import { format } from "date-fns"
import { SelectMachine, SelectBottleneckAnalysis } from "@/db/schema"

// Define types locally to avoid import issues
interface CellType {
  id: string
  name: string
  valueStreamId: string
}

interface EfficiencyMetric {
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

interface BottleneckAnalysis {
  id: string
  cellId: string
  date: string
  bottleneckMachineId: string
  bottleneckPercentage: number
  impactMinutes: number
  recommendedAction: string
}

export default function EfficiencyDashboard({
  userId,
  initialCells = [],
  initialMetrics = [],
  initialBottlenecks = []
}: {
  userId: string
  initialCells: CellType[]
  initialMetrics: EfficiencyMetric[]
  initialBottlenecks: BottleneckAnalysis[]
}) {
  const [selectedCellId, setSelectedCellId] = useState<string>(
    initialCells.length > 0 ? initialCells[0].id : ""
  )

  const [metrics, setMetrics] = useState<EfficiencyMetric[]>(initialMetrics)
  const [bottlenecks, setBottlenecks] =
    useState<BottleneckAnalysis[]>(initialBottlenecks)
  const [machines, setMachines] = useState<SelectMachine[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bottleneck dialog state
  const [isBottleneckDialogOpen, setIsBottleneckDialogOpen] = useState(false)
  const [editingBottleneck, setEditingBottleneck] =
    useState<BottleneckAnalysis | null>(null)

  const handleCellChange = async (cellId: string) => {
    if (!cellId) return

    setSelectedCellId(cellId)
    setIsLoading(true)
    setError(null)

    try {
      // Get a date range for the past 7 days
      const today = new Date()
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(today.getDate() - 7)

      const todayStr = today.toISOString().split("T")[0]
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]

      // Fetch efficiency metrics
      const metricsResult = await getEfficiencyMetricsAction({
        cellId,
        startDate: sevenDaysAgoStr,
        endDate: todayStr
      })

      if (metricsResult.isSuccess && metricsResult.data) {
        // Ensure metrics are properly formatted
        const formattedMetrics = metricsResult.data.map(metric => ({
          id: metric.id || `metric-${Math.random().toString(36).substr(2, 9)}`,
          cellId: metric.cellId,
          date: metric.date,
          efficiency:
            typeof metric.efficiency === "number"
              ? metric.efficiency
              : typeof metric.efficiency === "string"
                ? parseFloat(metric.efficiency)
                : 0,
          attainmentPercentage:
            metric.attainmentPercentage ||
            (typeof metric.efficiency === "number"
              ? metric.efficiency
              : typeof metric.efficiency === "string"
                ? parseFloat(metric.efficiency)
                : 0),
          lossPercentage:
            100 -
            (metric.attainmentPercentage
              ? typeof metric.attainmentPercentage === "number"
                ? metric.attainmentPercentage
                : parseFloat(metric.attainmentPercentage as string)
              : typeof metric.efficiency === "number"
                ? metric.efficiency
                : typeof metric.efficiency === "string"
                  ? parseFloat(metric.efficiency)
                  : 0),
          totalLossMinutes: metric.downtimeMinutes
            ? parseFloat(metric.downtimeMinutes as string)
            : metric.totalDowntime
              ? Math.round(metric.totalDowntime / 60)
              : 0,
          totalBreakMinutes: 30, // Default break time
          totalCycleTime: metric.totalRuntime || 0,
          standardCycleTime: 480 * 60 // 8 hours in seconds
        }))

        setMetrics(formattedMetrics)
      } else {
        // If no metrics were found, set empty array
        console.log("No efficiency metrics found for this cell")
        setMetrics([])
      }

      // Fetch bottleneck data
      const bottlenecksResult = await getBottleneckAnalysisAction({
        cellId,
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
        const formattedBottlenecks = bottlenecksResult.data.map(b => ({
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
        setBottlenecks(formattedBottlenecks)
      } else {
        console.log("No bottleneck analysis data found in database")
        setBottlenecks([])
      }

      // Fetch machines for the selected cell
      const machinesResult = await getMachinesByCellIdAction(cellId)
      if (machinesResult.isSuccess && machinesResult.data) {
        setMachines(machinesResult.data)
      } else {
        setMachines([])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load efficiency data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle bottleneck dialog
  const handleOpenBottleneckDialog = (bottleneck?: BottleneckAnalysis) => {
    setEditingBottleneck(bottleneck || null)
    setIsBottleneckDialogOpen(true)
  }

  const handleBottleneckAdded = (bottleneck: SelectBottleneckAnalysis) => {
    // If editing, replace the existing bottleneck
    if (editingBottleneck) {
      setBottlenecks(prev =>
        prev.map(b =>
          b.id === bottleneck.id
            ? {
                ...b,
                bottleneckMachineId:
                  bottleneck.bottleneckMachineId || b.bottleneckMachineId,
                bottleneckPercentage: bottleneck.bottleneckSeverity
                  ? parseFloat(bottleneck.bottleneckSeverity.toString())
                  : b.bottleneckPercentage,
                impactMinutes: bottleneck.bottleneckSeverity
                  ? Math.round(
                      parseFloat(bottleneck.bottleneckSeverity.toString()) * 4.8
                    )
                  : b.impactMinutes,
                recommendedAction: bottleneck.notes || b.recommendedAction
              }
            : b
        )
      )
    } else {
      // Add the new bottleneck
      const newBottleneck: BottleneckAnalysis = {
        id: bottleneck.id,
        cellId: bottleneck.cellId,
        date: bottleneck.date,
        bottleneckMachineId: bottleneck.bottleneckMachineId || "",
        bottleneckPercentage: bottleneck.bottleneckSeverity
          ? parseFloat(bottleneck.bottleneckSeverity.toString())
          : 0,
        impactMinutes: bottleneck.bottleneckSeverity
          ? Math.round(
              parseFloat(bottleneck.bottleneckSeverity.toString()) * 4.8
            )
          : 0,
        recommendedAction: bottleneck.notes || "Review machine performance"
      }
      setBottlenecks(prev => [...prev, newBottleneck])
    }
  }

  // Prepare data for charts
  const efficiencyChartData = metrics
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(metric => ({
      date: formatDate(metric.date),
      Efficiency: Number(metric.efficiency.toFixed(1)),
      "Loss %": Number(metric.lossPercentage.toFixed(1))
    }))

  const downtimeChartData = metrics
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(metric => ({
      date: formatDate(metric.date),
      "Downtime (min)": Math.round(metric.totalLossMinutes),
      "Break Time (min)": metric.totalBreakMinutes
    }))

  const bottleneckChartData = bottlenecks
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(bottleneck => ({
      date: formatDate(bottleneck.date),
      "Impact (%)": Number(bottleneck.bottleneckPercentage.toFixed(1)),
      "Impact (min)": bottleneck.impactMinutes
    }))

  // Helper function to format dates
  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString)
      return format(date, "MMM d")
    } catch (error) {
      return dateString
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Manufacturing Efficiency
        </h1>
        <p className="text-muted-foreground">
          Monitor and analyze production efficiency and bottlenecks.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="w-full md:w-64">
          <label className="mb-2 block text-sm font-medium">Select Cell</label>
          <Select
            value={selectedCellId}
            onValueChange={handleCellChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cell" />
            </SelectTrigger>
            <SelectContent>
              {initialCells.length === 0 ? (
                <SelectItem value="no-cells" disabled>
                  No cells available
                </SelectItem>
              ) : (
                initialCells.map(cell => (
                  <SelectItem key={cell.id} value={cell.id}>
                    {cell.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <CalculateMissingMetrics cellId={selectedCellId} />
      </div>

      <Tabs defaultValue="efficiency" className="space-y-4">
        <TabsList>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="downtime">Downtime</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
        </TabsList>

        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Metrics</CardTitle>
              <CardDescription>
                Daily production efficiency and loss percentage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-96 items-center justify-center">
                  <p className="text-muted-foreground">
                    Loading efficiency data...
                  </p>
                </div>
              ) : efficiencyChartData.length > 0 ? (
                <div className="flex h-96 items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold">Efficiency Chart</p>
                    <p className="text-muted-foreground">
                      Displaying efficiency metrics for{" "}
                      {efficiencyChartData.length} days
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      {efficiencyChartData.map((data, i) => (
                        <div key={i} className="rounded-md border p-4">
                          <p className="font-medium">{data.date}</p>
                          <p className="text-xl text-emerald-600">
                            Efficiency: {data.Efficiency}%
                          </p>
                          <p className="text-rose-600">
                            Loss: {data["Loss %"]}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-96 items-center justify-center">
                  <p className="text-muted-foreground">
                    No efficiency data available. Select a cell with recorded
                    metrics.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Downtime Analysis</CardTitle>
              <CardDescription>
                Daily production time lost to downtime and breaks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-96 items-center justify-center">
                  <p className="text-muted-foreground">
                    Loading downtime data...
                  </p>
                </div>
              ) : downtimeChartData.length > 0 ? (
                <div className="flex h-96 items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold">Downtime Chart</p>
                    <p className="text-muted-foreground">
                      Displaying downtime metrics for {downtimeChartData.length}{" "}
                      days
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      {downtimeChartData.map((data, i) => (
                        <div key={i} className="rounded-md border p-4">
                          <p className="font-medium">{data.date}</p>
                          <p className="text-xl text-amber-600">
                            Downtime: {data["Downtime (min)"]} mins
                          </p>
                          <p className="text-blue-600">
                            Breaks: {data["Break Time (min)"]} mins
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-96 items-center justify-center">
                  <p className="text-muted-foreground">
                    No downtime data available. Select a cell with recorded
                    metrics.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bottleneck Analysis</CardTitle>
                <CardDescription>
                  Impact of bottlenecks on production
                </CardDescription>
              </div>
              <Button
                onClick={() => handleOpenBottleneckDialog()}
                disabled={!selectedCellId || isLoading}
                size="sm"
              >
                <Plus className="mr-2 size-4" />
                Add Bottleneck
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-96 items-center justify-center">
                  <p className="text-muted-foreground">
                    Loading bottleneck data...
                  </p>
                </div>
              ) : bottleneckChartData.length > 0 ? (
                <div>
                  <div className="h-96 overflow-auto">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {bottleneckChartData.map((data, i) => (
                        <div key={i} className="rounded-md border p-4">
                          <p className="font-medium">{data.date}</p>
                          <p className="text-xl text-red-600">
                            Impact: {data["Impact (%)"]}%
                          </p>
                          <p className="text-gray-600">
                            Minutes lost: {data["Impact (min)"]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        Recommended Actions
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {bottlenecks.map(bottleneck => (
                        <div
                          key={bottleneck.id}
                          className="hover:bg-muted/50 cursor-pointer rounded-md border p-4"
                          onClick={() => handleOpenBottleneckDialog(bottleneck)}
                        >
                          <p className="font-medium">
                            {formatDate(bottleneck.date)} -{" "}
                            {bottleneck.bottleneckMachineId}
                          </p>
                          <p className="text-muted-foreground">
                            {bottleneck.recommendedAction}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-96 flex-col items-center justify-center gap-4">
                  <p className="text-muted-foreground">
                    No bottleneck data available.
                  </p>
                  <Button
                    onClick={() => handleOpenBottleneckDialog()}
                    disabled={!selectedCellId || isLoading}
                  >
                    <Plus className="mr-2 size-4" />
                    Add Bottleneck Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottleneck Dialog */}
      <BottleneckDialog
        open={isBottleneckDialogOpen}
        onOpenChange={setIsBottleneckDialogOpen}
        onBottleneckAdded={handleBottleneckAdded}
        editBottleneck={
          editingBottleneck
            ? {
                id: editingBottleneck.id,
                cellId: editingBottleneck.cellId,
                date: editingBottleneck.date,
                bottleneckMachineId:
                  editingBottleneck.bottleneckMachineId || null,
                bottleneckSeverity: editingBottleneck.bottleneckPercentage
                  ? editingBottleneck.bottleneckPercentage.toString()
                  : null,
                notes: editingBottleneck.recommendedAction || null,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            : undefined
        }
        machines={machines}
        cellId={selectedCellId}
      />
    </div>
  )
}
