"use client"

import { startProductionRunAction } from "@/actions/db/production-logs-actions"
import { completeProductionCycleAction } from "@/actions/db/production-logs-actions"
import { logDowntimeAction } from "@/actions/db/downtime-logs-actions"
import { calculateMachineEfficiencyAction } from "@/actions/db/efficiency-metrics-actions"
import { SelectCell, SelectPart } from "@/db/schema"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { CalendarIcon, PlusCircle, Save, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { saveProductionScreenAction } from "@/actions/db/production-logs-actions"

interface ProductionRun {
  id: string
  partId: string
  partNumber: string
  partDescription: string
  quantity: number
  standardTime: number
  startTime: Date
  completed: boolean
  machine1CompleteTime: Date | null
  machine2CompleteTime: Date | null
  machine3CompleteTime: Date | null
  machine4CompleteTime: Date | null
  lunchBreak: boolean
  timeDifference: number
  reasonForTimeDifference: string
}

interface EfficiencyMetrics {
  attainmentPercentage: number
  totalLossMinutes: number
  totalBreakMinutes: number
  lossPercentage: number
}

interface HourXHourTrackerProps {
  userId: string
  parts: SelectPart[]
  cells: SelectCell[]
}

export function HourXHourTracker({
  userId,
  parts,
  cells
}: HourXHourTrackerProps) {
  // State
  const [selectedCell, setSelectedCell] = useState<string>("")
  const [date, setDate] = useState<Date>(new Date())
  const [shift, setShift] = useState<string>("1st")
  const [runningParts, setRunningParts] = useState<ProductionRun[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [metrics, setMetrics] = useState<EfficiencyMetrics>({
    attainmentPercentage: 100,
    totalLossMinutes: 0,
    totalBreakMinutes: 0,
    lossPercentage: 0
  })
  const [selectKey, setSelectKey] = useState<number>(0)

  // Handlers
  const handleCellChange = (value: string) => {
    setSelectedCell(value)
  }

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
    }
  }

  const handleShiftChange = (value: string) => {
    setShift(value)
  }

  const handleAddPart = async (partId: string) => {
    console.log("handleAddPart called with partId:", partId)

    try {
      if (!selectedCell) {
        toast.error("Please select a cell first", {
          duration: 2000,
          position: "bottom-right",
          style: {
            background: "var(--toast-error-background)",
            color: "var(--toast-error-foreground)",
            border: "1px solid var(--toast-error-border)"
          }
        })
        return
      }

      const part = parts.find(p => p.id === partId)
      if (!part) {
        console.error("Part not found with ID:", partId)
        toast.error("Part not found")
        return
      }

      console.log("Found part:", part)
      const startTime = new Date()

      // Create a run ID
      const mockRunId = `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      // Determine standard time based on bottleneck machine
      const bottleneckMachineNumber = part.bottleneckMachine
      let standardTime = 0

      switch (bottleneckMachineNumber) {
        case 1:
          standardTime = part.cycleTimeMachine1
          break
        case 2:
          standardTime = part.cycleTimeMachine2
          break
        case 3:
          standardTime = part.cycleTimeMachine3
          break
        case 4:
          standardTime = part.cycleTimeMachine4
          break
        default:
          standardTime = Math.max(
            part.cycleTimeMachine1,
            part.cycleTimeMachine2,
            part.cycleTimeMachine3,
            part.cycleTimeMachine4
          )
      }

      const newPart = {
        id: mockRunId,
        partId: part.id,
        partNumber: part.partNumber,
        partDescription: part.description,
        quantity: 1,
        standardTime,
        startTime,
        completed: false,
        machine1CompleteTime: null,
        machine2CompleteTime: null,
        machine3CompleteTime: null,
        machine4CompleteTime: null,
        lunchBreak: false,
        timeDifference: 0,
        reasonForTimeDifference: ""
      }

      console.log("Adding to runningParts:", newPart)

      setRunningParts(prevParts => [...prevParts, newPart])

      toast.success(`Part ${part.partNumber} added to production`, {
        style: {
          background: "var(--toast-success-background)",
          color: "var(--toast-success-foreground)",
          border: "1px solid var(--toast-success-border)"
        }
      })

      // Force re-render and calculate efficiency
      calculateEfficiency()
    } catch (error) {
      console.error("Failed to add part to production:", error)
      toast.error("Failed to add part to production")
    }
  }

  const handleCompleteOperation = async (
    runId: string,
    machineNumber: number
  ) => {
    try {
      const completeTime = new Date()

      // Update the running parts directly without calling the server action
      setRunningParts(
        runningParts.map(run => {
          if (run.id === runId) {
            const updatedRun = { ...run }

            if (machineNumber === 1)
              updatedRun.machine1CompleteTime = completeTime
            if (machineNumber === 2)
              updatedRun.machine2CompleteTime = completeTime
            if (machineNumber === 3)
              updatedRun.machine3CompleteTime = completeTime
            if (machineNumber === 4)
              updatedRun.machine4CompleteTime = completeTime

            // Calculate the time difference if this is the bottleneck machine
            const part = parts.find(p => p.id === run.partId)
            if (part && part.bottleneckMachine === machineNumber) {
              const startTime = run.startTime.getTime()
              const actualTime = completeTime.getTime() - startTime

              // Get the appropriate cycle time based on machine number
              let standardTimeMinutes = 0
              switch (machineNumber) {
                case 1:
                  standardTimeMinutes = part.cycleTimeMachine1
                  break
                case 2:
                  standardTimeMinutes = part.cycleTimeMachine2
                  break
                case 3:
                  standardTimeMinutes = part.cycleTimeMachine3
                  break
                case 4:
                  standardTimeMinutes = part.cycleTimeMachine4
                  break
              }

              const standardTimeMs = standardTimeMinutes * 60 * 1000 // convert minutes to ms
              updatedRun.timeDifference = Math.round(
                (actualTime - standardTimeMs) / (60 * 1000)
              ) // difference in minutes
            }

            // Check if all operations are complete
            if (
              updatedRun.machine1CompleteTime &&
              updatedRun.machine2CompleteTime &&
              updatedRun.machine3CompleteTime &&
              updatedRun.machine4CompleteTime
            ) {
              updatedRun.completed = true
            }

            return updatedRun
          }
          return run
        })
      )

      // Calculate efficiency after operation completion
      calculateEfficiency()

      toast.success(`Operation ${machineNumber} completed`)
    } catch (error) {
      toast.error("Failed to complete operation")
      console.error(error)
    }
  }

  const handleLunchBreakToggle = async (runId: string, checked: boolean) => {
    setRunningParts(
      runningParts.map(run => {
        if (run.id === runId) {
          return { ...run, lunchBreak: checked }
        }
        return run
      })
    )

    // Don't try to log downtime with server action, just recalculate efficiency
    calculateEfficiency()

    if (checked) {
      toast.success("Lunch break logged")
    }
  }

  const handleReasonChange = (runId: string, reason: string) => {
    setRunningParts(
      runningParts.map(run => {
        if (run.id === runId) {
          return { ...run, reasonForTimeDifference: reason }
        }
        return run
      })
    )
  }

  const calculateEfficiency = () => {
    try {
      // Calculate total time differences (losses)
      let totalLossMinutes = 0
      let totalBreaks = 0

      // Calculate based on the running parts
      runningParts.forEach(run => {
        if (run.timeDifference > 0) {
          totalLossMinutes += run.timeDifference
        }

        if (run.lunchBreak) {
          totalBreaks++
        }
      })

      // Calculate loss percentage
      const totalBreakMinutes = totalBreaks * 30 // Assuming 30 min breaks
      const totalWorkMinutes = runningParts.length > 0 ? 480 : 0 // 8 hour shift if there are running parts
      const lossPercentage =
        totalWorkMinutes > 0
          ? ((totalLossMinutes + totalBreakMinutes) / totalWorkMinutes) * 100
          : 0

      // Calculate attainment (efficiency)
      const attainmentPercentage = Math.min(
        100,
        Math.max(0, 100 - lossPercentage)
      )

      // Update metrics
      setMetrics({
        attainmentPercentage: parseFloat(attainmentPercentage.toFixed(1)),
        totalLossMinutes,
        totalBreakMinutes,
        lossPercentage: parseFloat(lossPercentage.toFixed(1))
      })
    } catch (error) {
      console.error("Failed to calculate efficiency", error)
    }
  }

  const handleSaveScreen = async () => {
    if (runningParts.length === 0) {
      toast.error("No data to save", {
        description: "Please add parts to production first."
      })
      return
    }

    try {
      setIsSaving(true)
      setSaveSuccess(false)

      // Make sure we have the latest efficiency metrics
      calculateEfficiency()

      // Prepare the data
      const screenData = {
        userId,
        cellId: selectedCell,
        date: date.toISOString(),
        shift,
        productionRuns: runningParts,
        metrics
      }

      console.log("Saving production data:", screenData)

      // Call the server action
      const result = await saveProductionScreenAction(screenData)

      if (result.isSuccess) {
        setSaveSuccess(true)
        toast.success("✅ Production data saved!", {
          description:
            "All production data has been successfully saved to the database.",
          duration: 4000,
          className: "bg-green-50 text-green-900 border-green-300 font-medium"
        })

        // Reset success state after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false)
        }, 3000)
      } else {
        toast.error("❌ Save failed", {
          description:
            result.message ||
            "Could not save production data. Please try again.",
          duration: 3000
        })
      }
    } catch (error) {
      console.error("Failed to save production data", error)
      toast.error("❌ Error saving data", {
        description: "An unexpected error occurred. Please try again.",
        duration: 3000,
        style: {
          background: "var(--toast-error-background)",
          color: "var(--toast-error-foreground)",
          border: "1px solid var(--toast-error-border)"
        }
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Initialize & fetch data
  useEffect(() => {
    // Only calculate efficiency if there are running parts
    if (runningParts.length > 0) {
      calculateEfficiency()
    }
  }, [runningParts.length])

  return (
    <div className="space-y-6">
      {/* Header Controls */}
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
          <Select value={selectedCell} onValueChange={handleCellChange}>
            <SelectTrigger
              id="cell-select"
              className={`w-40 ${!selectedCell ? "animate-pulse border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/30" : ""}`}
            >
              <SelectValue placeholder="Select Cell" />
            </SelectTrigger>
            <SelectContent>
              {cells.map(cell => (
                <SelectItem key={cell.id} value={cell.id}>
                  {cell.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-36 justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 size-4" />
                {format(date, "MM/dd/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Shift</label>
          <Select value={shift} onValueChange={handleShiftChange}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1st">1st</SelectItem>
              <SelectItem value="2nd">2nd</SelectItem>
              <SelectItem value="3rd">3rd</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              "/manufacturing/input"
            }}
          >
            <PlusCircle className="size-4" />
            New/Edit Parts
          </Button>

          <Button
            variant="default"
            className={`flex items-center gap-2 px-5 transition-all duration-300 ${
              saveSuccess
                ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                : ""
            }`}
            onClick={handleSaveScreen}
            disabled={isSaving || runningParts.length === 0}
          >
            {isSaving ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="size-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save Screen
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Production Tracking Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10"></TableHead>
              <TableHead>Part Number</TableHead>
              <TableHead>Part Description</TableHead>
              <TableHead className="w-16">Qty</TableHead>
              <TableHead className="w-16">Std Time</TableHead>
              <TableHead>Machine 1</TableHead>
              <TableHead>Machine 2</TableHead>
              <TableHead>Machine 3</TableHead>
              <TableHead>Machine 4</TableHead>
              <TableHead className="w-16">+/-</TableHead>
              <TableHead className="w-28">Lunch Break</TableHead>
              <TableHead>Reason For Time Difference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runningParts.map((run, index) => (
              <TableRow
                key={index}
                className={run.completed ? "bg-muted/20" : ""}
              >
                <TableCell>
                  <Checkbox checked={run.completed} disabled />
                </TableCell>
                <TableCell>{run.partNumber}</TableCell>
                <TableCell>{run.partDescription}</TableCell>
                <TableCell>{run.quantity}</TableCell>
                <TableCell>{run.standardTime}</TableCell>
                <TableCell>
                  {run.machine1CompleteTime ? (
                    format(run.machine1CompleteTime, "h:mm a")
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteOperation(run.id, 1)}
                    >
                      Complete
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {run.machine2CompleteTime ? (
                    format(run.machine2CompleteTime, "h:mm a")
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteOperation(run.id, 2)}
                    >
                      Complete
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {run.machine3CompleteTime ? (
                    format(run.machine3CompleteTime, "h:mm a")
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteOperation(run.id, 3)}
                    >
                      Complete
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {run.machine4CompleteTime ? (
                    format(run.machine4CompleteTime, "h:mm a")
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteOperation(run.id, 4)}
                    >
                      Complete
                    </Button>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "font-medium",
                    run.timeDifference > 0 ? "text-destructive" : "",
                    run.timeDifference < 0
                      ? "text-green-600 dark:text-green-500"
                      : ""
                  )}
                >
                  {run.timeDifference !== 0 ? run.timeDifference : "-"}
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={run.lunchBreak}
                    onCheckedChange={checked =>
                      handleLunchBreakToggle(run.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={run.reasonForTimeDifference}
                    onChange={e => handleReasonChange(run.id, e.target.value)}
                    placeholder="Enter reason..."
                    className="h-8"
                  />
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={12}>
                <div className="flex flex-col items-center py-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="part-select"
                        className="text-sm font-medium"
                      >
                        Select Part:
                      </label>
                      <Select
                        key={selectKey}
                        onValueChange={value => {
                          console.log("Part selected:", value)
                          handleAddPart(value)
                          // Increment the key to force a re-render of the Select component
                          setSelectKey(prev => prev + 1)
                        }}
                      >
                        <SelectTrigger
                          id="part-select"
                          className={`w-64 ${!selectedCell ? "opacity-50" : ""}`}
                          disabled={!selectedCell}
                        >
                          <SelectValue
                            placeholder={
                              !selectedCell
                                ? "Select a cell first"
                                : "Choose a part to add"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {parts.length === 0 ? (
                            <div className="text-muted-foreground p-2 text-center text-sm">
                              No parts available. Add parts in the Parts
                              Management section.
                            </div>
                          ) : (
                            parts.map(part => (
                              <SelectItem key={part.id} value={part.id}>
                                {part.partNumber} - {part.description}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open("/manufacturing/input", "_blank")
                        }}
                      >
                        Manage Parts
                      </Button>
                    </div>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Dashboard Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Production Metrics */}
        <div className="col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Production Metrics</CardTitle>
              <CardDescription>
                Real-time efficiency metrics for {format(date, "MMMM d, yyyy")}{" "}
                - {shift} shift
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-sm font-medium">
                    Total Loss Mins
                  </span>
                  <span className="text-2xl font-bold">
                    {metrics.totalLossMinutes}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-sm font-medium">
                    Total Breaks
                  </span>
                  <span className="text-2xl font-bold">
                    {metrics.totalBreakMinutes / 30}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-sm font-medium">
                    Loss Minutes + Breaks
                  </span>
                  <span className="text-2xl font-bold">
                    {metrics.totalLossMinutes + metrics.totalBreakMinutes}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-sm font-medium">
                    Loss (%)
                  </span>
                  <span className="text-2xl font-bold">
                    {metrics.lossPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-muted-foreground mb-2 text-sm font-medium">
                  Attainment (%)
                </div>
                <div className="relative flex size-40 items-center justify-center">
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center rounded-full text-5xl font-bold",
                      metrics.attainmentPercentage >= 90
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : metrics.attainmentPercentage >= 75
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    )}
                  >
                    {metrics.attainmentPercentage.toFixed(0)}
                  </div>
                </div>
                <div className="mt-6 flex gap-8">
                  <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full bg-green-100 dark:bg-green-800"></div>
                    <span className="text-sm">Winning (&gt;90%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full bg-amber-100 dark:bg-amber-800"></div>
                    <span className="text-sm">Mistakes Happen (&gt;75%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full bg-red-100 dark:bg-red-800"></div>
                    <span className="text-sm">WHOOPS! (&lt;75%)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup Times */}
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Setup Times (Min)</CardTitle>
              <CardDescription>
                Standard setup times for machines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 grid grid-cols-4 gap-2 border-b pb-2">
                <div className="text-center font-medium">M1</div>
                <div className="text-center font-medium">M2</div>
                <div className="text-center font-medium">M3</div>
                <div className="text-center font-medium">M4</div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">10</div>
                <div className="text-center">10</div>
                <div className="text-center">10</div>
                <div className="text-center">10</div>
              </div>

              <div className="mt-4 border-t pt-2">
                <div className="mb-2 grid grid-cols-4 gap-2 border-b pb-2">
                  <div className="text-center font-medium">M1</div>
                  <div className="text-center font-medium">M2</div>
                  <div className="text-center font-medium">M3</div>
                  <div className="text-center font-medium">M4</div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">10</div>
                    <div className="bg-yellow-100 text-center dark:bg-yellow-900/40">
                      5
                    </div>
                    <div className="bg-green-100 text-center dark:bg-green-900/40">
                      2
                    </div>
                    <div className="bg-amber-100 text-center dark:bg-amber-900/40">
                      4
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">10</div>
                    <div className="bg-yellow-100 text-center dark:bg-yellow-900/40">
                      5
                    </div>
                    <div className="bg-yellow-100 text-center dark:bg-yellow-900/40">
                      5
                    </div>
                    <div className="bg-green-100 text-center dark:bg-green-900/40">
                      2
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
