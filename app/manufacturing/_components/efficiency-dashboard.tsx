"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import { SelectCell } from "@/db/schema"
import { CalendarIcon, Download } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { format, subDays, addDays, eachDayOfInterval } from "date-fns"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { calculateMachineEfficiencyAction } from "@/actions/db/efficiency-metrics-actions"
import { getBottleneckAnalysisAction } from "@/actions/db/bottleneck-analysis-actions"
import { toast } from "sonner"
import { DateRange } from "react-day-picker"

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

interface EfficiencyDashboardProps {
  userId: string
  initialCells: SelectCell[]
  initialMetrics: EfficiencyMetric[]
  initialBottlenecks: BottleneckAnalysis[]
}

export function EfficiencyDashboard({
  userId,
  initialCells,
  initialMetrics,
  initialBottlenecks
}: EfficiencyDashboardProps) {
  const [selectedCell, setSelectedCell] = useState<string>("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date()
  })
  const [metrics, setMetrics] = useState<EfficiencyMetric[]>(
    initialMetrics || []
  )
  const [bottlenecks, setBottlenecks] = useState<BottleneckAnalysis[]>(
    initialBottlenecks || []
  )
  const [activeTab, setActiveTab] = useState<string>("efficiency")

  const handleCellChange = (value: string) => {
    setSelectedCell(value)
    fetchData(value, dateRange)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range)
      fetchData(selectedCell, range)
    }
  }

  const handleExportData = () => {
    // In a real app, this would generate a CSV or Excel export
    toast.success("Data export started")

    // Example of how to create a CSV export
    if (metrics.length === 0) {
      toast.error("No data to export")
      return
    }

    // Create CSV content
    const headers =
      "Date,Cell ID,Attainment %,Loss %,Total Loss Minutes,Total Break Minutes\n"
    const rows = metrics
      .map(
        metric =>
          `${metric.date},${metric.cellId},${metric.attainmentPercentage},${metric.lossPercentage},${metric.totalLossMinutes},${metric.totalBreakMinutes}`
      )
      .join("\n")

    const csvContent = headers + rows

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `efficiency-${format(new Date(), "yyyy-MM-dd")}.csv`
    )
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const fetchData = async (cellId: string, range: DateRange | undefined) => {
    if (!cellId || !range?.from || !range?.to) return

    try {
      // Generate array of dates in the range
      const dates = eachDayOfInterval({
        start: range.from,
        end: range.to
      })

      // Fetch efficiency metrics for each date
      const metricsPromises = dates.map(date =>
        calculateMachineEfficiencyAction({
          cellId,
          date: format(date, "yyyy-MM-dd")
        })
      )

      const metricsResults = await Promise.all(metricsPromises)
      const validMetrics = metricsResults
        .filter(result => result.isSuccess && result.data)
        .map(result => result.data) as EfficiencyMetric[]

      setMetrics(validMetrics)

      // Fetch bottleneck analysis
      const bottleneckResult = await getBottleneckAnalysisAction({
        cellId,
        startDate: format(range.from, "yyyy-MM-dd"),
        endDate: format(range.to, "yyyy-MM-dd")
      })

      if (bottleneckResult.isSuccess && bottleneckResult.data) {
        setBottlenecks(bottleneckResult.data)
      }
    } catch (error) {
      console.error("Error fetching efficiency data:", error)
      toast.error("Failed to fetch efficiency data")
    }
  }

  // Prepare chart data
  const efficiencyChartData = metrics.map(metric => ({
    date: format(new Date(metric.date), "MM/dd"),
    attainment: metric.attainmentPercentage,
    loss: metric.lossPercentage
  }))

  const downtimeChartData = metrics.map(metric => ({
    date: format(new Date(metric.date), "MM/dd"),
    loss: metric.totalLossMinutes,
    breaks: metric.totalBreakMinutes
  }))

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="bg-card flex flex-wrap items-center gap-4 rounded-lg border p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cell-select">Cell</Label>
          <Select value={selectedCell} onValueChange={handleCellChange}>
            <SelectTrigger id="cell-select" className="w-40">
              <SelectValue placeholder="Select Cell" />
            </SelectTrigger>
            <SelectContent>
              {initialCells.map(cell => (
                <SelectItem key={cell.id} value={cell.id}>
                  {cell.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 size-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="ml-auto">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportData}
          >
            <Download className="size-4" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="efficiency">Efficiency Metrics</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottleneck Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="efficiency" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Attainment Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle>Attainment Percentage</CardTitle>
                <CardDescription>
                  Daily attainment percentage over the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {efficiencyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={efficiencyChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="attainment"
                        stroke="#4ade80"
                        strokeWidth={2}
                        name="Attainment %"
                      />
                      <Line
                        type="monotone"
                        dataKey="loss"
                        stroke="#f87171"
                        strokeWidth={2}
                        name="Loss %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Downtime Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle>Downtime Minutes</CardTitle>
                <CardDescription>Loss and break minutes by day</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {downtimeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={downtimeChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="loss" fill="#f87171" name="Loss Minutes" />
                      <Bar
                        dataKey="breaks"
                        fill="#60a5fa"
                        name="Break Minutes"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Efficiency Metrics Table */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
              <CardDescription>
                Daily efficiency metrics for the selected cell
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-left font-medium">Date</th>
                      <th className="p-2 text-left font-medium">
                        Attainment %
                      </th>
                      <th className="p-2 text-left font-medium">Loss %</th>
                      <th className="p-2 text-left font-medium">
                        Loss Minutes
                      </th>
                      <th className="p-2 text-left font-medium">
                        Break Minutes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.length > 0 ? (
                      metrics.map((metric, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">
                            {format(new Date(metric.date), "MMM dd, yyyy")}
                          </td>
                          <td
                            className={cn(
                              "p-2 font-medium",
                              metric.attainmentPercentage >= 90
                                ? "text-green-600"
                                : metric.attainmentPercentage >= 75
                                  ? "text-amber-600"
                                  : "text-red-600"
                            )}
                          >
                            {metric.attainmentPercentage.toFixed(1)}%
                          </td>
                          <td className="p-2">
                            {metric.lossPercentage.toFixed(1)}%
                          </td>
                          <td className="p-2">{metric.totalLossMinutes}</td>
                          <td className="p-2">{metric.totalBreakMinutes}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-muted-foreground p-4 text-center"
                        >
                          No data available. Select a cell and date range to
                          view metrics.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-6">
          {/* Bottleneck Analysis */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Bottleneck Summary</CardTitle>
              <CardDescription>
                Analysis of bottlenecks in the production process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-left font-medium">Date</th>
                      <th className="p-2 text-left font-medium">
                        Bottleneck Machine
                      </th>
                      <th className="p-2 text-left font-medium">Impact %</th>
                      <th className="p-2 text-left font-medium">
                        Impact Minutes
                      </th>
                      <th className="p-2 text-left font-medium">
                        Recommended Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bottlenecks.length > 0 ? (
                      bottlenecks.map((bottleneck, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">
                            {format(new Date(bottleneck.date), "MMM dd, yyyy")}
                          </td>
                          <td className="p-2">
                            Machine{" "}
                            {bottleneck.bottleneckMachineId.split("-").pop()}
                          </td>
                          <td
                            className={cn(
                              "p-2 font-medium",
                              bottleneck.bottleneckPercentage >= 75
                                ? "text-red-600"
                                : bottleneck.bottleneckPercentage >= 50
                                  ? "text-amber-600"
                                  : "text-green-600"
                            )}
                          >
                            {bottleneck.bottleneckPercentage.toFixed(1)}%
                          </td>
                          <td className="p-2">{bottleneck.impactMinutes}</td>
                          <td className="p-2">
                            {bottleneck.recommendedAction}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-muted-foreground p-4 text-center"
                        >
                          No bottleneck data available. Select a cell and date
                          range to view analysis.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Bottleneck Impact Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Bottleneck Impact</CardTitle>
              <CardDescription>
                Impact of bottlenecks on production efficiency
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {bottlenecks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={bottlenecks.map(b => ({
                      date: format(new Date(b.date), "MM/dd"),
                      impact: b.impactMinutes,
                      machine: `Machine ${b.bottleneckMachineId.split("-").pop()}`
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name, props) => {
                        if (name === "impact")
                          return [`${value} minutes`, "Impact"]
                        return [value, name]
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="impact"
                      fill="#ef4444"
                      name="Impact Minutes"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">
                    No bottleneck data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
