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
import { CalendarIcon, FileDown, RefreshCw, AlertCircle } from "lucide-react"
import { getProductionLogsByDateRangeAction } from "@/actions/db/production-logs-actions"
import { SelectCell } from "@/db/schema"
import { toast } from "sonner"
import { cn } from "@/app/manufacturing/lib/utils"

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

export function ProductionHistoryViewer({
  userId,
  initialCells
}: ProductionHistoryViewerProps) {
  // State
  const [selectedCell, setSelectedCell] = useState<string>("")
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().setDate(new Date().getDate() - 7))
  )
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load production logs when cell or date range changes
  useEffect(() => {
    if (selectedCell) {
      loadProductionLogs()
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
        if (result.data.length === 0) {
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

  // Export to CSV
  const exportToCSV = () => {
    if (productionLogs.length === 0) {
      toast.error("No data to export")
      return
    }

    try {
      // Create CSV content
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
      const csvContent = [
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

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `production-history-${format(new Date(), "yyyy-MM-dd")}.csv`
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
                onClick={loadProductionLogs}
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
                disabled={productionLogs.length === 0 || isLoading}
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
            <p className="text-muted-foreground">Loading production logs...</p>
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
      {!isLoading && !error && productionLogs.length > 0 && (
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
                    <TableHead className="text-right">Std. Time</TableHead>
                    <TableHead className="text-right">Act. Time</TableHead>
                    <TableHead className="text-right">Diff.</TableHead>
                    <TableHead className="text-right">Efficiency</TableHead>
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

      {/* Empty state */}
      {!isLoading && !error && productionLogs.length === 0 && selectedCell && (
        <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="text-muted-foreground size-8" />
            <h3 className="text-lg font-medium">No production data found</h3>
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
    </div>
  )
}
