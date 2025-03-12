"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CalendarIcon,
  FileDown,
  RefreshCw,
  AlertCircle,
  LineChart
} from "lucide-react"
import { getProductionLogsByDateRangeAction } from "@/actions/db/production-logs-actions"
import { getEfficiencyMetricsAction } from "@/actions/db/efficiency-metrics-actions"
import { SelectCell } from "@/db/schema"
import { toast } from "sonner"
import { cn } from "@/app/manufacturing/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BatchMetricsCalculator } from "./batch-metrics-calculator"

interface ProductionHistoryViewerProps {
  userId: string
  initialCells: SelectCell[]
}

interface ProductionLog {
  id: string
  date: string
  shift: string
  cellId: string
  cellName: string
  partNumber: string
  description: string
  quantity: number
  standardTime: number
  actualTime: number
  difference: number
  efficiency: number
  completed: boolean
}

interface EfficiencyMetric {
  id: string
  date: string
  cellId: string | null
  partsProduced: number
  totalRuntime: number
  totalDowntime: number
  efficiency: number | string
  attainmentPercentage: number | string | null
  targetCount: string | null
  actualCount: string | null
  downtimeMinutes: string | null
  createdAt?: Date
  updatedAt?: Date
}

export function ProductionHistoryViewer({
  userId,
  initialCells
}: ProductionHistoryViewerProps) {
  // Set the first cell as default (assumed to be cell 1)
  const defaultCellId = initialCells.length > 0 ? initialCells[0].id : ""

  // State
  const [selectedCell, setSelectedCell] = useState<string>(defaultCellId)
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().setDate(new Date().getDate() - 7))
  )
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([])
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<
    EfficiencyMetric[]
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("production")

  // Load production logs when cell or date range changes
  useEffect(() => {
    if (selectedCell) {
      loadProductionLogs()
      loadEfficiencyMetrics()
    }
  }, [selectedCell, startDate, endDate])

  // Load production logs
  const loadProductionLogs = async () => {
    if (!selectedCell) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await getProductionLogsByDateRangeAction(
        selectedCell,
        startDate.toISOString(),
        endDate.toISOString()
      )

      if (result.isSuccess) {
        setProductionLogs(result.data)
        if (result.data.length === 0 && activeTab === "production") {
          setError("No production logs found for the selected date range")
        }
      } else {
        setError("Failed to load production logs: " + result.message)
        toast.error("Failed to load production logs")
      }
    } catch (error) {
      console.error("Error loading production logs:", error)
      setError("An unexpected error occurred while loading production logs")
      toast.error("An error occurred while loading production logs")
    } finally {
      setIsLoading(false)
    }
  }

  // Load efficiency metrics
  const loadEfficiencyMetrics = async () => {
    if (!selectedCell) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await getEfficiencyMetricsAction({
        cellId: selectedCell,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd")
      })

      if (result.isSuccess) {
        setEfficiencyMetrics(result.data.map(convertEfficiencyMetric))
        if (result.data.length === 0 && activeTab === "metrics") {
          setError("No efficiency metrics found for the selected date range")
        }
      } else {
        setError("Failed to load efficiency metrics: " + result.message)
        toast.error("Failed to load efficiency metrics")
      }
    } catch (error) {
      console.error("Error loading efficiency metrics:", error)
      setError("An unexpected error occurred while loading efficiency metrics")
      toast.error("An error occurred while loading efficiency metrics")
    } finally {
      setIsLoading(false)
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    if (activeTab === "production" && productionLogs.length === 0) {
      toast.error("No production data to export")
      return
    }

    if (activeTab === "metrics" && efficiencyMetrics.length === 0) {
      toast.error("No metrics data to export")
      return
    }

    try {
      let csvContent = ""

      if (activeTab === "production") {
        // Create Production CSV content
        const headers = [
          "Date",
          "Shift",
          "Cell",
          "Part Number",
          "Description",
          "Quantity",
          "Standard Time",
          "Actual Time",
          "Difference",
          "Efficiency"
        ]
        csvContent = [
          headers.join(","),
          ...productionLogs.map(log =>
            [
              format(new Date(log.date), "MM/dd/yyyy"),
              log.shift,
              `"${log.cellName}"`,
              `"${log.partNumber}"`,
              `"${log.description}"`,
              log.quantity,
              log.standardTime,
              log.actualTime,
              log.difference,
              `${log.efficiency}%`
            ].join(",")
          )
        ].join("\n")
      } else {
        // Create Metrics CSV content
        const headers = [
          "Date",
          "Parts Produced",
          "Runtime (min)",
          "Downtime (min)",
          "Efficiency",
          "Attainment",
          "Target",
          "Actual"
        ]
        csvContent = [
          headers.join(","),
          ...efficiencyMetrics.map(metric =>
            [
              format(new Date(metric.date), "MM/dd/yyyy"),
              metric.partsProduced,
              Math.round(metric.totalRuntime / 60), // Convert seconds to minutes
              Math.round(metric.totalDowntime / 60), // Convert seconds to minutes
              `${metric.efficiency}%`,
              metric.attainmentPercentage
                ? `${metric.attainmentPercentage}%`
                : "N/A",
              metric.targetCount || "N/A",
              metric.actualCount || "N/A"
            ].join(",")
          )
        ].join("\n")
      }

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `${activeTab}-history-${format(new Date(), "yyyy-MM-dd")}.csv`
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("CSV file exported successfully")
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      toast.error("Failed to export data to CSV")
    }
  }

  // Get cell name from ID
  const getCellName = (cellId: string): string => {
    const cell = initialCells.find(c => c.id === cellId)
    return cell ? cell.name : "Unknown Cell"
  }

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setError(null)

    if (tab === "production" && productionLogs.length === 0) {
      setError("No production logs found for the selected date range")
    } else if (tab === "metrics" && efficiencyMetrics.length === 0) {
      setError("No efficiency metrics found for the selected date range")
    }
  }

  // Add a conversion function for the metrics
  function convertEfficiencyMetric(metric: any): EfficiencyMetric {
    return {
      id: metric.id,
      date: metric.date,
      cellId: metric.cellId,
      partsProduced: metric.partsProduced,
      totalRuntime: metric.totalRuntime,
      totalDowntime: metric.totalDowntime,
      efficiency:
        typeof metric.efficiency === "string"
          ? parseFloat(metric.efficiency)
          : metric.efficiency,
      attainmentPercentage:
        metric.attainmentPercentage != null
          ? typeof metric.attainmentPercentage === "string"
            ? parseFloat(metric.attainmentPercentage)
            : metric.attainmentPercentage
          : null,
      targetCount: metric.targetCount,
      actualCount: metric.actualCount,
      downtimeMinutes: metric.downtimeMinutes,
      createdAt: metric.createdAt,
      updatedAt: metric.updatedAt
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Production History</CardTitle>
          <CardDescription>
            View historical production data and efficiency metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cell-select"
                className="flex items-center text-sm font-medium"
              >
                Cell <span className="ml-1 text-red-500">*</span>
                <span className="text-muted-foreground ml-1 text-xs">
                  (required)
                </span>
              </label>
              <Select value={selectedCell} onValueChange={setSelectedCell}>
                <SelectTrigger
                  id="cell-select"
                  className={`w-40 ${!selectedCell ? "animate-pulse border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/30" : ""}`}
                >
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
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-36 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {format(startDate, "MM/dd/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={date => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-36 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {format(endDate, "MM/dd/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={date => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  loadProductionLogs()
                  loadEfficiencyMetrics()
                }}
                disabled={!selectedCell || isLoading}
              >
                <RefreshCw
                  className={cn("size-4", isLoading && "animate-spin")}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={exportToCSV}
                disabled={
                  (activeTab === "production" && productionLogs.length === 0) ||
                  (activeTab === "metrics" && efficiencyMetrics.length === 0) ||
                  isLoading
                }
              >
                <FileDown className="size-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="text-primary size-8 animate-spin" />
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data display */}
      {!isLoading && selectedCell && (
        <Tabs
          defaultValue="production"
          value={activeTab}
          onValueChange={handleTabChange}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="production" className="flex items-center gap-2">
              <RefreshCw className="size-4" /> Production Logs
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <LineChart className="size-4" /> Efficiency Metrics
            </TabsTrigger>
          </TabsList>

          {/* Production Logs Tab */}
          <TabsContent value="production">
            {!error && productionLogs.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Shift</TableHead>
                          <TableHead>Cell</TableHead>
                          <TableHead>Part #</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">
                            Std. Time
                          </TableHead>
                          <TableHead className="text-right">
                            Act. Time
                          </TableHead>
                          <TableHead className="text-right">Diff.</TableHead>
                          <TableHead className="text-right">
                            Efficiency
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productionLogs.map(log => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {format(new Date(log.date), "MM/dd/yyyy")}
                            </TableCell>
                            <TableCell>{log.shift}</TableCell>
                            <TableCell>{log.cellName}</TableCell>
                            <TableCell>{log.partNumber}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {log.description}
                            </TableCell>
                            <TableCell className="text-right">
                              {log.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {log.standardTime} min
                            </TableCell>
                            <TableCell className="text-right">
                              {log.actualTime} min
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right",
                                log.difference > 0
                                  ? "text-red-500"
                                  : log.difference < 0
                                    ? "text-green-500"
                                    : ""
                              )}
                            >
                              {log.difference > 0 ? "+" : ""}
                              {log.difference} min
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-medium",
                                log.efficiency < 85
                                  ? "text-red-500"
                                  : log.efficiency >= 100
                                    ? "text-green-500"
                                    : ""
                              )}
                            >
                              {log.efficiency}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state for production logs */}
            {!isLoading &&
              !error &&
              productionLogs.length === 0 &&
              activeTab === "production" && (
                <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="text-muted-foreground size-8" />
                    <h3 className="text-lg font-medium">
                      No production data found
                    </h3>
                    <p className="text-muted-foreground">
                      No production logs found for the selected date range.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        const thirtyDaysAgo = new Date()
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                        setStartDate(thirtyDaysAgo)
                        loadProductionLogs()
                      }}
                    >
                      Try last 30 days
                    </Button>
                  </div>
                </div>
              )}
          </TabsContent>

          {/* Efficiency Metrics Tab */}
          <TabsContent value="metrics">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                {!error && efficiencyMetrics.length > 0 && (
                  <Card>
                    <CardContent className="p-0">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">
                                Parts Produced
                              </TableHead>
                              <TableHead className="text-right">
                                Runtime (min)
                              </TableHead>
                              <TableHead className="text-right">
                                Downtime (min)
                              </TableHead>
                              <TableHead className="text-right">
                                Efficiency
                              </TableHead>
                              <TableHead className="text-right">
                                Attainment
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {efficiencyMetrics.map(metric => (
                              <TableRow key={metric.id}>
                                <TableCell>
                                  {format(new Date(metric.date), "MM/dd/yyyy")}
                                </TableCell>
                                <TableCell className="text-right">
                                  {metric.partsProduced}
                                </TableCell>
                                <TableCell className="text-right">
                                  {Math.round(metric.totalRuntime / 60)}{" "}
                                  {/* Convert seconds to minutes */}
                                </TableCell>
                                <TableCell className="text-right">
                                  {Math.round(metric.totalDowntime / 60)}{" "}
                                  {/* Convert seconds to minutes */}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "text-right font-medium",
                                    typeof metric.efficiency === "number"
                                      ? metric.efficiency < 85
                                        ? "text-red-500"
                                        : metric.efficiency >= 100
                                          ? "text-green-500"
                                          : ""
                                      : parseFloat(
                                            metric.efficiency as string
                                          ) < 85
                                        ? "text-red-500"
                                        : parseFloat(
                                              metric.efficiency as string
                                            ) >= 100
                                          ? "text-green-500"
                                          : ""
                                  )}
                                >
                                  {typeof metric.efficiency === "number"
                                    ? `${metric.efficiency}%`
                                    : `${parseFloat(metric.efficiency as string)}%`}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "text-right",
                                    typeof metric.attainmentPercentage ===
                                      "number"
                                      ? metric.attainmentPercentage &&
                                        metric.attainmentPercentage < 85
                                        ? "text-red-500"
                                        : metric.attainmentPercentage &&
                                            metric.attainmentPercentage >= 100
                                          ? "text-green-500"
                                          : ""
                                      : metric.attainmentPercentage &&
                                          parseFloat(
                                            metric.attainmentPercentage as string
                                          ) < 85
                                        ? "text-red-500"
                                        : metric.attainmentPercentage &&
                                            parseFloat(
                                              metric.attainmentPercentage as string
                                            ) >= 100
                                          ? "text-green-500"
                                          : ""
                                  )}
                                >
                                  {metric.attainmentPercentage
                                    ? typeof metric.attainmentPercentage ===
                                      "number"
                                      ? `${metric.attainmentPercentage}%`
                                      : `${parseFloat(metric.attainmentPercentage as string)}%`
                                    : "N/A"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Empty state for metrics */}
                {!isLoading &&
                  !error &&
                  efficiencyMetrics.length === 0 &&
                  activeTab === "metrics" && (
                    <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="text-muted-foreground size-8" />
                        <h3 className="text-lg font-medium">
                          No efficiency metrics found
                        </h3>
                        <p className="text-muted-foreground">
                          No efficiency metrics found for the selected date
                          range. Use the calculator to generate metrics.
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              {/* Batch calculator */}
              <div>
                <BatchMetricsCalculator
                  cellId={selectedCell}
                  onComplete={() => {
                    loadEfficiencyMetrics()
                    setActiveTab("metrics")
                  }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
