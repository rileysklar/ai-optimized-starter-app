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
import { CalendarIcon, FileDown, RefreshCw } from "lucide-react"
import { getProductionLogsByDateRangeAction } from "@/actions/db/production-logs-actions"
import { SelectCell } from "@/db/schema"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

    try {
      const result = await getProductionLogsByDateRangeAction(
        selectedCell,
        startDate.toISOString(),
        endDate.toISOString()
      )

      if (result.isSuccess) {
        setProductionLogs(result.data)
      } else {
        toast.error("Failed to load production logs")
      }
    } catch (error) {
      console.error("Error loading production logs:", error)
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

    // Create CSV content
    const headers = [
      "Date",
      "Shift",
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
                <RefreshCw className="size-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={exportToCSV}
                disabled={productionLogs.length === 0}
              >
                <FileDown className="size-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Logs Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-center">Standard Time</TableHead>
                <TableHead className="text-center">Actual Time</TableHead>
                <TableHead className="text-center">Difference</TableHead>
                <TableHead className="text-center">Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center">
                    <div className="flex justify-center">
                      <div className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </div>
                    <div className="mt-2">Loading production logs...</div>
                  </TableCell>
                </TableRow>
              ) : productionLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-muted-foreground py-8 text-center"
                  >
                    {selectedCell
                      ? "No production logs found for the selected date range."
                      : "Please select a cell to view production logs."}
                  </TableCell>
                </TableRow>
              ) : (
                productionLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.date), "MM/dd/yyyy")}
                    </TableCell>
                    <TableCell>{log.shift}</TableCell>
                    <TableCell>{log.partNumber}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell className="text-center">
                      {log.quantity}
                    </TableCell>
                    <TableCell className="text-center">
                      {log.standardTime} min
                    </TableCell>
                    <TableCell className="text-center">
                      {log.actualTime} min
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-center font-medium",
                        log.difference > 0 ? "text-destructive" : "",
                        log.difference < 0
                          ? "text-green-600 dark:text-green-500"
                          : ""
                      )}
                    >
                      {log.difference} min
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-center font-medium",
                        log.efficiency < 75 ? "text-destructive" : "",
                        log.efficiency >= 90
                          ? "text-green-600 dark:text-green-500"
                          : "",
                        log.efficiency >= 75 && log.efficiency < 90
                          ? "text-amber-600 dark:text-amber-500"
                          : ""
                      )}
                    >
                      {log.efficiency}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
