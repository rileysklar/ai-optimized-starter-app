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
  LineChart,
  Database,
  Download,
  Info
} from "lucide-react"
import { getProductionLogsByDateRangeAction } from "@/actions/db/production-logs-actions"
import {
  getEfficiencyMetricsAction,
  calculateMachineEfficiencyAction
} from "@/actions/db/efficiency-metrics-actions"
import { SelectCell } from "@/db/schema"
import { toast } from "sonner"
import { cn } from "@/app/manufacturing/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"

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
  userName: string
  machineId: string
  machineName: string
  userId: string
  startTime: string
  endTime: string | null
  notes: string | null
  associatedPart?: any | null
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

// ErrorFallback component for the error boundary
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex h-[400px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-red-300 p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <AlertCircle className="size-12 text-red-500" />
        <h3 className="text-xl font-medium">Something went wrong</h3>
        <p className="text-muted-foreground max-w-md">
          An unexpected error occurred while displaying the production history.
        </p>
        <pre className="max-w-md overflow-auto rounded-md bg-red-50 p-4 text-sm dark:bg-red-950/30">
          {error.message}
        </pre>
        <div className="mt-4 flex gap-4">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="size-4" />
            Reload Page
          </Button>
          <Button
            onClick={resetErrorBoundary}
            className="flex items-center gap-2"
          >
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
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
      // Output debug info but don't change the functionality that was working
      console.log("Date range being queried:", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startFormatted: format(startDate, "yyyy-MM-dd"),
        endFormatted: format(endDate, "yyyy-MM-dd")
      })

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
        console.error("Error loading logs:", result.message)
        setError("Failed to load production logs: " + result.message)

        // Show a detailed error toast
        toast.error("Failed to load production logs", {
          description: result.message,
          action: {
            label: "Retry",
            onClick: () => loadProductionLogs()
          },
          duration: 5000
        })

        // Automatically try loading mock data if it's a database error
        if (
          result.message.includes("Database error") ||
          result.message.includes("query error")
        ) {
          // Create a mock cell ID to trigger the mock data generator
          const mockCellId = `mock-${selectedCell.slice(-6)}`

          toast.info("Attempting to load sample data instead...", {
            duration: 2000
          })

          setTimeout(async () => {
            try {
              const mockResult = await getProductionLogsByDateRangeAction(
                mockCellId,
                startDate.toISOString(),
                endDate.toISOString()
              )

              if (mockResult.isSuccess) {
                setProductionLogs(mockResult.data)
                setError(
                  "Using sample data for demonstration due to database error"
                )

                toast.success("Loaded sample data for demonstration", {
                  description:
                    "Using generated data instead of database records."
                })
              }
            } catch (mockError) {
              console.error("Failed to load mock data:", mockError)
            }
          }, 2000)
        }
      }
    } catch (error) {
      console.error("Error loading production logs:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      setError(`An unexpected error occurred: ${errorMessage}`)

      toast.error("An error occurred while loading production logs", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => loadProductionLogs()
        },
        duration: 5000
      })
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
      // Debug logs to troubleshoot range issues
      console.log("Efficiency metrics date range being queried:", {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd")
      })

      const result = await getEfficiencyMetricsAction({
        cellId: selectedCell,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd")
      })

      if (result.isSuccess) {
        setEfficiencyMetrics(result.data.map(convertEfficiencyMetric))

        // Check if any dates in the range are missing metrics
        if (result.data.length === 0) {
          // No metrics found - automatically calculate them
          console.log(
            "No metrics found for date range - calculating automatically"
          )
          await calculateMissingMetrics()
        } else {
          // Check if we have metrics for all dates in the range
          const dateRange = getDatesBetween(startDate, endDate)
          const existingDates = new Set(result.data.map(metric => metric.date))

          // Find missing dates
          const missingDates = dateRange.filter(
            date => !existingDates.has(format(date, "yyyy-MM-dd"))
          )

          if (missingDates.length > 0) {
            console.log(
              `Found ${missingDates.length} dates missing metrics - calculating automatically`
            )
            await calculateMissingMetrics()
          }
        }

        if (result.data.length === 0 && activeTab === "metrics") {
          setError("No efficiency metrics found for the selected date range")
        }
      } else {
        console.error("Error loading metrics:", result.message)
        setError("Failed to load efficiency metrics: " + result.message)

        // Show a detailed error toast
        toast.error("Failed to load efficiency metrics", {
          description: result.message,
          action: {
            label: "Retry",
            onClick: () => loadEfficiencyMetrics()
          },
          duration: 5000
        })
      }
    } catch (error) {
      console.error("Error loading efficiency metrics:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      setError(`An unexpected error occurred: ${errorMessage}`)

      toast.error("An error occurred while loading efficiency metrics", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => loadEfficiencyMetrics()
        },
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get all dates between start and end
  const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = []
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  // Calculate missing metrics for the current date range and cell
  const calculateMissingMetrics = async () => {
    if (!selectedCell) return

    try {
      // Get all dates in the range
      const dateRange = getDatesBetween(startDate, endDate)
      let calculatedCount = 0

      // Show loading toast for long calculations
      const loadingToast =
        dateRange.length > 5
          ? toast.loading(`Calculating metrics for ${dateRange.length} days...`)
          : null

      // Process each date in the range
      for (const date of dateRange) {
        const formattedDate = format(date, "yyyy-MM-dd")

        try {
          const result = await calculateMachineEfficiencyAction({
            cellId: selectedCell,
            date: formattedDate
          })

          if (result.isSuccess) {
            calculatedCount++
          }
        } catch (err) {
          // Ignore calculation errors for individual dates
          console.warn(`Could not calculate metrics for ${formattedDate}:`, err)
        }
      }

      // Dismiss loading toast if it was shown
      if (loadingToast) {
        toast.dismiss(loadingToast)
      }

      if (calculatedCount > 0) {
        toast.success(`Calculated metrics for ${calculatedCount} days`)

        // Refresh metrics to show newly calculated data
        const refreshResult = await getEfficiencyMetricsAction({
          cellId: selectedCell,
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd")
        })

        if (refreshResult.isSuccess) {
          setEfficiencyMetrics(refreshResult.data.map(convertEfficiencyMetric))
        }
      } else if (dateRange.length > 0) {
        toast.info(
          "No new metrics could be calculated. This may be due to missing production data."
        )
      }
    } catch (error) {
      console.error("Error calculating metrics:", error)
      toast.error("Failed to calculate metrics automatically")
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
          "Machine",
          "Part Number",
          "Description",
          "Part Source",
          "User",
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
              `"${log.cellName.replace(/"/g, '""')}"`,
              `"${log.machineName.replace(/"/g, '""')}"`,
              `"${log.partNumber.replace(/"/g, '""')}"`,
              `"${log.description.replace(/"/g, '""')}"`,
              log.associatedPart ? "Database" : "Derived",
              log.userName,
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

  // Reset all state function
  const resetState = () => {
    setSelectedCell(defaultCellId)
    setStartDate(new Date(new Date().setDate(new Date().getDate() - 7)))
    setEndDate(new Date())
    setProductionLogs([])
    setEfficiencyMetrics([])
    setIsLoading(false)
    setError(null)
    setActiveTab("production")
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={resetState}>
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
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={() => {
                    // Force a clean database query with retries
                    const runForceRefresh = async () => {
                      setIsLoading(true)
                      setError(null)

                      try {
                        toast.info("Performing direct database query", {
                          description:
                            "Bypassing any caching to get latest data"
                        })

                        // Add a timestamp to request to bypass API/browser caching
                        const cacheBuster = new Date().getTime()

                        const result = await getProductionLogsByDateRangeAction(
                          `${selectedCell}?t=${cacheBuster}`,
                          startDate.toISOString(),
                          endDate.toISOString()
                        )

                        if (result.isSuccess) {
                          setProductionLogs(result.data)
                          toast.success(
                            `Retrieved ${result.data.length} logs directly from database`
                          )

                          if (result.data.length === 0) {
                            setError(
                              "No production logs found in direct database query"
                            )
                          }
                        } else {
                          toast.error("Database query failed", {
                            description: result.message
                          })
                        }

                        // Also refresh metrics
                        await loadEfficiencyMetrics()
                      } catch (error) {
                        console.error("Force refresh error:", error)
                        toast.error("Force refresh failed", {
                          description:
                            error instanceof Error
                              ? error.message
                              : "Unknown error"
                        })
                      } finally {
                        setIsLoading(false)
                      }
                    }

                    runForceRefresh()
                  }}
                  disabled={!selectedCell || isLoading}
                >
                  <Database className="size-4" />
                  Force DB Query
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={exportToCSV}
                  disabled={
                    (activeTab === "production" &&
                      productionLogs.length === 0) ||
                    (activeTab === "metrics" &&
                      efficiencyMetrics.length === 0) ||
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
          <Alert
            variant={
              error.includes("Database error")
                ? "destructive"
                : error.includes("sample data")
                  ? "default"
                  : "default"
            }
            className={
              error.includes("Database error")
                ? "bg-red-50 dark:bg-red-950/30"
                : error.includes("sample data")
                  ? "bg-blue-50 dark:bg-blue-950/30"
                  : "bg-yellow-50 dark:bg-yellow-950/30"
            }
          >
            {error.includes("sample data") ? (
              <Database className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            <div className="flex-1">
              <AlertDescription>{error}</AlertDescription>
              {error.includes("Database error") && (
                <p className="mt-2 text-sm opacity-80">
                  This could be due to a temporary database connection issue.
                  You can try loading sample data for demonstration purposes
                  instead.
                </p>
              )}
            </div>
            {error.includes("Database error") && (
              <Button
                variant="default"
                className="ml-auto flex items-center gap-1"
                onClick={() => {
                  // Create a mock cell ID to trigger the mock data generator
                  const mockCellId = `mock-${selectedCell.slice(-6)}`

                  // Try loading with mock data
                  if (activeTab === "production") {
                    getProductionLogsByDateRangeAction(
                      mockCellId,
                      startDate.toISOString(),
                      endDate.toISOString()
                    ).then(result => {
                      if (result.isSuccess) {
                        setProductionLogs(result.data)
                        setError(
                          "Using sample data for demonstration due to database error"
                        )
                        toast.success("Loaded sample data for demonstration", {
                          description:
                            "Using generated data instead of database records."
                        })
                      }
                    })
                  } else {
                    toast.info(
                      "Try switching to the Production Logs tab for sample data"
                    )
                  }
                }}
              >
                <Database className="mr-1 size-4" />
                Load Sample Data
              </Button>
            )}
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
              <TabsTrigger
                value="production"
                className="flex items-center gap-2"
              >
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
                            <TableHead>Machine</TableHead>
                            <TableHead>Part #</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="text-right">
                              Quantity
                            </TableHead>
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
                              <TableCell>{log.machineName}</TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    "font-medium",
                                    log.associatedPart
                                      ? "text-green-600 dark:text-green-400"
                                      : ""
                                  )}
                                  title={
                                    log.associatedPart
                                      ? `Database Part: ${log.partNumber}`
                                      : `Part: ${log.partNumber}`
                                  }
                                >
                                  {log.partNumber}
                                  {log.associatedPart && (
                                    <span className="ml-1.5 inline-flex size-2 rounded-full bg-green-500"></span>
                                  )}
                                </span>
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "max-w-[200px] truncate",
                                  log.associatedPart
                                    ? "text-green-600 dark:text-green-400"
                                    : ""
                                )}
                                title={log.description}
                              >
                                {log.description}
                              </TableCell>
                              <TableCell>{log.userName}</TableCell>
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
                <div className="md:col-span-3">
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
                                    {format(
                                      new Date(metric.date),
                                      "MM/dd/yyyy"
                                    )}
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
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ErrorBoundary>
  )
}
