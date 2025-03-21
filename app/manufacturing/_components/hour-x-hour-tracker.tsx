"use client"

import { startProductionRunAction } from "@/actions/db/production-logs-actions"
import { completeProductionCycleAction } from "@/actions/db/production-logs-actions"
import { logDowntimeAction } from "@/actions/db/downtime-logs-actions"
import { calculateMachineEfficiencyAction } from "@/actions/db/efficiency-metrics-actions"
import { getMachinesByCellIdAction } from "@/actions/db/machines-actions"
import { SelectCell, SelectMachine, SelectPart } from "@/db/schema"
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
import {
  AlertCircle,
  CalendarIcon,
  CheckCircle2,
  Clock,
  PlusCircle,
  Save,
  Timer,
  Zap,
  Play,
  StopCircle,
  Building2,
  History,
  ChevronDown,
  Plus
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { saveProductionScreenAction } from "@/actions/db/production-logs-actions"
import { useConfetti } from "@/app/manufacturing/lib/hooks/use-confetti"
import {
  endShiftAction,
  getActiveShiftByUserIdAction,
  startShiftAction,
  updateShiftProductionDataAction
} from "@/actions/db/shifts-actions"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"

// Common reason categories for time differences
const COMMON_REASONS = [
  { value: "tooling", label: "Tooling Issues" },
  { value: "material", label: "Material Quality" },
  { value: "setup", label: "Setup Time" },
  { value: "maintenance", label: "Maintenance" },
  { value: "operator", label: "Operator Training" },
  { value: "programming", label: "Programming Error" },
  { value: "inspection", label: "Quality Inspection" },
  { value: "other", label: "Other (please specify)" }
]

// Common break durations in minutes
const BREAK_DURATIONS = [
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min (Lunch)" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 0, label: "Custom" }
]

interface RunningPart {
  id: string
  partId: string
  partNumber: string
  partName: string
  quantity: number
  standardTime: number
  startTime: Date
  endTime?: Date
  actualTime?: number
  timeDifference?: number
  lunchBreak: boolean
  breakDuration: number
  reasonForTimeDifference?: string
  reasonCategory: string
  bottleneckMachine?: number
}

interface Metrics {
  totalStandardMinutes: number
  totalActualMinutes: number
  totalLossMinutes: number
  totalBreakMinutes: number
  lossPercentage: number
  efficiency: number
}

interface HourXHourTrackerProps {
  userId: string
  parts: SelectPart[]
  cells: SelectCell[]
}

// Helper function to format duration
function formatDuration(startTime: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - startTime.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

  const hours = Math.floor(diffInMinutes / 60)
  const minutes = diffInMinutes % 60

  return `${hours}h ${minutes}m`
}

// Add the BottleneckVisualizer component after the RunningPart interface
interface BottleneckVisualizerProps {
  parts: SelectPart[]
  machines: SelectMachine[]
}

function BottleneckVisualizer({ parts, machines }: BottleneckVisualizerProps) {
  // Use the most relevant parts - either the ones used in production or the first 3
  // Filter out parts with missing cycle times to ensure good data quality
  const relevantParts = parts
    .filter(
      part =>
        part.cycleTimeMachine1 !== null ||
        part.cycleTimeMachine2 !== null ||
        part.cycleTimeMachine3 !== null ||
        part.cycleTimeMachine4 !== null
    )
    .slice(0, 3)

  // Get actual machine names for display
  const machineNames = machines.map(
    machine => machine.name || "Unnamed Machine"
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Bottleneck Analysis</CardTitle>
        <CardDescription>
          How bottlenecks impact production in the "Make One, Move One" system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Cycle Time Table */}
        <div className="mb-6">
          <h3 className="text-md mb-2 font-medium">Part Cycle Times (min)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Part</th>
                  {machineNames.slice(0, 2).map((name, index) => (
                    <th
                      key={`header-${index}`}
                      className="border p-2 text-center"
                    >
                      {name}
                    </th>
                  ))}
                  {machineNames.length < 2 && (
                    <>
                      {Array.from({ length: 2 - machineNames.length }).map(
                        (_, i) => (
                          <th
                            key={`empty-header-${i}`}
                            className="border p-2 text-center"
                          >
                            Machine {machineNames.length + i + 1}
                          </th>
                        )
                      )}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {relevantParts.length > 0 ? (
                  relevantParts.map((part, index) => {
                    // Use different colors for different part types
                    const bgColors = [
                      "bg-gray-100 dark:bg-gray-800",
                      "bg-green-100 dark:bg-green-900/40",
                      "bg-blue-100 dark:bg-blue-900/40"
                    ]

                    return (
                      <tr
                        key={part.id}
                        className={bgColors[index % bgColors.length]}
                      >
                        <td className="border p-2 font-medium">
                          {part.partNumber}
                        </td>
                        <td className="border p-2 text-center">
                          {part.cycleTimeMachine1 || "-"}
                        </td>
                        <td className="border p-2 text-center">
                          {part.cycleTimeMachine2 || "-"}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-muted-foreground border p-2 text-center"
                    >
                      No parts with cycle time data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottleneck Visualization */}
        <div>
          <h3 className="text-md mb-2 font-medium">
            Bottleneck Machine Calculation
          </h3>
          {relevantParts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Part</th>
                    {machineNames.slice(0, 2).map((name, index) => (
                      <th
                        key={`bottleneck-header-${index}`}
                        className="border p-2 text-center"
                      >
                        {name}
                      </th>
                    ))}
                    {machineNames.length < 2 && (
                      <>
                        {Array.from({ length: 2 - machineNames.length }).map(
                          (_, i) => (
                            <th
                              key={`empty-bottleneck-header-${i}`}
                              className="border p-2 text-center"
                            >
                              Machine {machineNames.length + i + 1}
                            </th>
                          )
                        )}
                      </>
                    )}
                    <th className="border p-2 text-center">Bottleneck</th>
                    <th className="border p-2 text-left">Standard Time</th>
                  </tr>
                </thead>
                <tbody>
                  {relevantParts.map((part, partIndex) => {
                    // Get cycle times for this part
                    const cycleTimes = [
                      part.cycleTimeMachine1 || 0,
                      part.cycleTimeMachine2 || 0,
                      part.cycleTimeMachine3 || 0,
                      part.cycleTimeMachine4 || 0
                    ].slice(0, Math.max(2, machineNames.length))

                    // Calculate bottleneck machine and time
                    let bottleneckMachine = 0
                    let bottleneckTime = 0

                    cycleTimes.forEach((time, index) => {
                      if (time > bottleneckTime) {
                        bottleneckTime = time
                        bottleneckMachine = index + 1
                      }
                    })

                    // Colors for different parts
                    const bgColors = [
                      "bg-gray-100 dark:bg-gray-800",
                      "bg-green-100 dark:bg-green-900/40",
                      "bg-blue-100 dark:bg-blue-900/40"
                    ]

                    return (
                      <tr
                        key={`bottleneck-${part.id}`}
                        className={bgColors[partIndex % bgColors.length]}
                      >
                        <td className="border p-2 font-medium">
                          {part.partNumber}
                        </td>
                        <td
                          className={`border p-2 text-center ${bottleneckMachine === 1 ? "font-bold" : ""}`}
                        >
                          {part.cycleTimeMachine1 || "-"}
                        </td>
                        <td
                          className={`border p-2 text-center ${bottleneckMachine === 2 ? "font-bold" : ""}`}
                        >
                          {part.cycleTimeMachine2 || "-"}
                        </td>
                        <td className="border p-2 text-center font-bold">
                          {bottleneckTime > 0 ? (
                            <Badge className="border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                              {machineNames[bottleneckMachine - 1] ||
                                `Machine ${bottleneckMachine}`}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="border p-2">
                          {bottleneckTime > 0
                            ? `${bottleneckTime} min`
                            : "Unknown"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted-foreground rounded-md border py-4 text-center">
              No parts with cycle time data available
            </div>
          )}

          <div className="mt-4 text-sm">
            <p className="mb-2">
              <strong>How Bottlenecks Are Calculated:</strong>
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Each part has a cycle time for each machine it passes through
              </li>
              <li>
                The <strong>bottleneck machine</strong> is the one with the
                longest cycle time
              </li>
              <li>
                In a "Make One, Move One" system, the bottleneck limits the
                throughput of the entire cell
              </li>
              <li>
                The standard work time is set by the bottleneck machine's cycle
                time
              </li>
            </ol>

            <div className="mt-3 rounded border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-950/30">
              <p className="flex items-center text-sm text-blue-700 dark:text-blue-400">
                <svg
                  className="mr-1 size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                The system will dynamically calculate the bottleneck for each
                production run based on the actual cycle times in the database.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to get the current hour index based on shift start time
const getCurrentHourIndex = (shiftStartTime: Date | null): number => {
  if (!shiftStartTime) return 0

  const now = new Date()
  const hours = Math.floor(
    (now.getTime() - shiftStartTime.getTime()) / (60 * 60 * 1000)
  )
  return Math.min(Math.max(0, hours), 7) // Keep within 0-7 range
}

// Define the production hour type
interface ProductionHour {
  label: string
  actualProduction: number
  attainmentPercentage: number
}

// Define the production hours data
const productionHours: ProductionHour[] = [
  { label: "Hour 1 (6-7 AM)", actualProduction: 42, attainmentPercentage: 84 },
  { label: "Hour 2 (7-8 AM)", actualProduction: 47, attainmentPercentage: 94 },
  { label: "Hour 3 (8-9 AM)", actualProduction: 38, attainmentPercentage: 76 },
  {
    label: "Hour 4 (9-10 AM)",
    actualProduction: 50,
    attainmentPercentage: 100
  },
  { label: "Hour 5 (10-11 AM)", actualProduction: 0, attainmentPercentage: 0 },
  { label: "Hour 6 (11-12 PM)", actualProduction: 0, attainmentPercentage: 0 },
  { label: "Hour 7 (12-1 PM)", actualProduction: 0, attainmentPercentage: 0 },
  { label: "Hour 8 (1-2 PM)", actualProduction: 0, attainmentPercentage: 0 }
]

// Target production per hour (calculated based on standard cycle time)
const targetProduction: number = 50

export function HourXHourTracker({
  userId,
  parts,
  cells
}: HourXHourTrackerProps) {
  // State
  const [selectedCell, setSelectedCell] = useState<string>("")
  const [date, setDate] = useState<Date>(new Date())
  const [shift, setShift] = useState<string>("1st")
  const [runningParts, setRunningParts] = useState<RunningPart[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [metrics, setMetrics] = useState<Metrics>({
    totalStandardMinutes: 0,
    totalActualMinutes: 0,
    totalLossMinutes: 0,
    totalBreakMinutes: 0,
    lossPercentage: 0,
    efficiency: 0
  })
  const [selectKey, setSelectKey] = useState<number>(0)
  const { triggerSuccess } = useConfetti()
  const router = useRouter()
  const { toast } = useToast()

  // New state for shift start time
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(null)
  const [endingShift, setEndingShift] = useState(false)
  const [activeShift, setActiveShift] = useState<any | null>(null)
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null)

  // New state for machines
  const [cellMachines, setCellMachines] = useState<SelectMachine[]>([])
  const [isLoadingMachines, setIsLoadingMachines] = useState(false)

  // Add missing state variables
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  const [selectedSite, setSelectedSite] = useState<string>("")
  const [selectedValueStream, setSelectedValueStream] = useState<string>("")

  // Reference to scroll to the current hour row
  const currentHourRef = useRef<HTMLTableRowElement>(null)

  // Fetch machines when a cell is selected
  const fetchMachinesByCell = async (cellId: string) => {
    if (!cellId) {
      toast({
        description: "No cell selected",
        variant: "destructive"
      })
      return
    }

    setIsLoadingMachines(true)
    try {
      const result = await getMachinesByCellIdAction(cellId)
      if (result.isSuccess) {
        setCellMachines(result.data || [])
      } else {
        setCellMachines([])
        toast({
          description:
            result.message || "Failed to fetch machines for this cell",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching machines:", error)
      setCellMachines([])
      toast({
        description: "Error fetching machines for this cell",
        variant: "destructive"
      })
    } finally {
      setIsLoadingMachines(false)
    }
  }

  // Improve the checkActiveShift function
  const checkActiveShift = async () => {
    try {
      if (!userId) return

      console.log("Checking for active shift for user:", userId)
      const result = await getActiveShiftByUserIdAction(userId)

      if (result.isSuccess && result.data) {
        const activeShift = result.data
        console.log(
          `Found active shift: ${activeShift.id}, started at ${new Date(activeShift.startTime).toLocaleTimeString()}`
        )

        setActiveShift(activeShift)
        setActiveShiftId(activeShift.id)
        setShiftStartTime(new Date(activeShift.startTime))
        setSelectedCell(activeShift.cellId || "")
        setShift(activeShift.shiftType)

        // If there's a cell ID, fetch machines for that cell
        if (activeShift.cellId) {
          console.log(`Fetching machines for cell ID: ${activeShift.cellId}`)
          fetchMachinesByCell(activeShift.cellId)
        }

        // Load saved production data if exists
        if (activeShift.productionData) {
          try {
            console.log("Attempting to restore production data")

            // Parse the production data
            const parsedData = JSON.parse(activeShift.productionData)

            // Validate the data structure before restoring
            if (parsedData.runs && Array.isArray(parsedData.runs)) {
              // Convert date strings back to Date objects
              const restoredRuns = parsedData.runs.map((run: any) => ({
                ...run,
                startTime: new Date(run.startTime),
                endTime: run.endTime ? new Date(run.endTime) : undefined,
                actualTime: run.actualTime || 0,
                timeDifference: run.timeDifference || 0,
                lunchBreak: Boolean(run.lunchBreak),
                breakDuration: run.breakDuration || 0,
                reasonCategory: run.reasonCategory || "",
                reasonForTimeDifference: run.reasonForTimeDifference || "",
                // Ensure all required props exist
                quantity: run.quantity || 1,
                id: run.id || uuidv4(),
                bottleneckMachine: run.bottleneckMachine || 0 // Ensure bottleneck is restored
              }))

              console.log(`Restored ${restoredRuns.length} production runs`)
              setRunningParts(restoredRuns)

              // Also restore metrics if available
              if (
                parsedData.metrics &&
                typeof parsedData.metrics === "object" &&
                "efficiency" in parsedData.metrics
              ) {
                console.log(
                  `Restored metrics with efficiency: ${parsedData.metrics.efficiency}%`
                )
                setMetrics(parsedData.metrics)
              } else {
                // If metrics are missing or invalid, recalculate based on restored runs
                console.log("Metrics missing or invalid, recalculating")
                setTimeout(() => calculateEfficiency(), 100)
              }

              toast({
                description: `Restored ${restoredRuns.length} production runs from previous session`
              })
            } else {
              console.warn("Invalid production data format:", parsedData)
              toast({
                description:
                  "Could not restore production data - invalid format",
                variant: "destructive"
              })
            }
          } catch (error) {
            console.error("Error restoring production data:", error)
            toast({
              description: "Failed to restore production data",
              variant: "destructive"
            })
          }
        }

        toast({
          description: `Active shift found, started at ${format(new Date(activeShift.startTime), "h:mm a")}`
        })
      } else {
        console.log("No active shift found for user")
      }
    } catch (error) {
      console.error("Error checking for active shift:", error)
      toast({
        description: "Error checking for active shift",
        variant: "destructive"
      })
    }
  }

  // Handlers
  const handleCellChange = (value: string) => {
    setSelectedCell(value)
    fetchMachinesByCell(value)

    // Reset running parts when changing cell
    if (runningParts.length > 0) {
      if (
        confirm(
          "Changing the cell will clear current production data. Continue?"
        )
      ) {
        setRunningParts([])
        setShiftStartTime(null) // Reset shift start time
      } else {
        return
      }
    }
  }

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
    }
  }

  const handleShiftChange = (value: string) => {
    setShift(value)
  }

  const handleStartShift = async () => {
    try {
      if (!selectedCell) {
        toast({
          description: "Please select a cell first",
          variant: "destructive"
        })
        return
      }

      const startTime = new Date()

      // Create data for the new shift
      const newShift = {
        userId: userId,
        cellId: selectedCell,
        companyId: selectedCompany || null,
        siteId: selectedSite || null,
        valueStreamId: selectedValueStream || null,
        date: startTime, // Add the required date property
        startTime: startTime,
        shiftType: shift,
        productionData: ""
      }

      // Start a new shift
      const result = await startShiftAction(newShift)
      if (result.isSuccess && result.data) {
        setActiveShift(result.data)
        setActiveShiftId(result.data.id)
        setShiftStartTime(new Date(result.data.startTime))
        toast({
          description: "Shift started successfully"
        })
      } else {
        toast({
          description: result.message || "Failed to start shift",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error starting shift:", error)
      toast({
        description: "An error occurred while starting the shift",
        variant: "destructive"
      })
    }
  }

  const handleEndShift = async () => {
    if (!activeShiftId) {
      toast({
        description: "No active shift to end",
        variant: "destructive"
      })
      return
    }

    try {
      setEndingShift(true)

      // Save production data before ending shift
      await handleSaveScreen()

      const endTime = new Date()
      const shiftDuration = shiftStartTime
        ? Math.round(
            (endTime.getTime() - shiftStartTime.getTime()) / (60 * 1000)
          )
        : 0

      // End the shift with appropriate data structure
      const result = await endShiftAction(activeShiftId, {
        endTime: endTime,
        duration: shiftDuration,
        attainmentPercentage: metrics.efficiency,
        totalLossMinutes: metrics.totalLossMinutes,
        totalBreakMinutes: metrics.totalBreakMinutes,
        productionData: JSON.stringify({
          runs: runningParts,
          metrics: metrics
        })
      })

      if (result.isSuccess) {
        setActiveShift(null)
        setActiveShiftId(null)
        setShiftStartTime(null)
        toast({
          description: "Shift ended successfully"
        })

        // Reset production data
        setRunningParts([])
        setMetrics({
          totalStandardMinutes: 0,
          totalActualMinutes: 0,
          totalLossMinutes: 0,
          totalBreakMinutes: 0,
          lossPercentage: 0,
          efficiency: 0
        })
      } else {
        toast({
          description: result.message || "Failed to end shift",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error ending shift:", error)
      toast({
        description: "An error occurred while ending the shift",
        variant: "destructive"
      })
    } finally {
      setEndingShift(false)
    }
  }

  const calculateBottleneck = (partId: string): number => {
    // Find the part in the parts array
    const part = parts.find(p => p.id === partId)
    if (!part) return 0

    // Get the cycle times for each machine
    // In a real implementation, this would come from the part data
    // For now, we'll use simplified logic based on the diagram

    let maxCycleTime = 0
    let bottleneckMachineIndex = 0

    // Check cycle times for each machine and find the maximum
    // This is a simplified example - in a real application you would
    // get the actual cycle times from your database
    const cycleTimes = [
      part.cycleTimeMachine1 || 0,
      part.cycleTimeMachine2 || 0,
      part.cycleTimeMachine3 || 0,
      part.cycleTimeMachine4 || 0
    ].slice(0, cellMachines.length)

    cycleTimes.forEach((cycleTime, index) => {
      if (cycleTime > maxCycleTime) {
        maxCycleTime = cycleTime
        bottleneckMachineIndex = index + 1 // Machine indexes are 1-based
      }
    })

    console.log(
      `Calculated bottleneck for part ${part.partNumber}: Machine ${bottleneckMachineIndex} (${maxCycleTime} min)`
    )
    return bottleneckMachineIndex
  }

  const handleAddPart = (part: SelectPart, standardTime: number) => {
    try {
      // Get the current time
      const startTime = new Date()

      // Generate a unique ID for this run
      const runId = uuidv4()

      // Calculate bottleneck machine for this part
      const bottleneckMachine = calculateBottleneck(part.id)

      // Use the bottleneck machine's cycle time as the standard time
      // This is a simplified approach - you may need more complex logic
      let calculatedStandardTime = standardTime
      if (calculatedStandardTime === 0) {
        // If no standard time was provided, calculate it from the bottleneck
        if (bottleneckMachine === 1 && part.cycleTimeMachine1) {
          calculatedStandardTime = part.cycleTimeMachine1
        } else if (bottleneckMachine === 2 && part.cycleTimeMachine2) {
          calculatedStandardTime = part.cycleTimeMachine2
        } else if (bottleneckMachine === 3 && part.cycleTimeMachine3) {
          calculatedStandardTime = part.cycleTimeMachine3
        } else if (bottleneckMachine === 4 && part.cycleTimeMachine4) {
          calculatedStandardTime = part.cycleTimeMachine4
        } else {
          // Fallback to any available cycle time
          calculatedStandardTime =
            part.cycleTimeMachine1 ||
            part.cycleTimeMachine2 ||
            part.cycleTimeMachine3 ||
            part.cycleTimeMachine4 ||
            10 // Default to 10 minutes
        }
      }

      // Create a new running part object
      const newPart: RunningPart = {
        id: runId,
        partId: part.id,
        partNumber: part.partNumber,
        partName: part.description,
        quantity: 1,
        standardTime: calculatedStandardTime,
        startTime,
        lunchBreak: false,
        breakDuration: 0,
        actualTime: 0, // Initialize with 0
        timeDifference: 0, // Initialize with 0
        reasonForTimeDifference: "",
        reasonCategory: "",
        bottleneckMachine: bottleneckMachine // Store the calculated bottleneck machine
      }

      // Add the new part to the running parts array
      setRunningParts([...runningParts, newPart])

      // Call calculate efficiency
      calculateEfficiency()

      // Show success toast
      toast({
        description: `Added part ${part.partNumber} to production (Bottleneck: Machine ${bottleneckMachine})`
      })

      // Reset the part select field by incrementing the key
      setSelectKey(prev => prev + 1)
    } catch (error) {
      console.error("Error adding part:", error)
      toast({
        description: "Failed to add part to production",
        variant: "destructive"
      })
    }
  }

  const handleCompleteMachine = (runId: string, machineNumber: number) => {
    try {
      const completeTime = new Date()
      const runIndex = runningParts.findIndex(run => run.id === runId)
      if (runIndex === -1) return

      // Clone the run to avoid modifying state directly
      const updatedParts = [...runningParts]
      const updatedRun = { ...updatedParts[runIndex] }

      // Find the part details
      const part = parts.find(p => p.id === updatedRun.partId)
      if (!part) return

      // Determine if this is the bottleneck machine for calculating efficiency
      const isBottleneckMachine = machineNumber === part.bottleneckMachine

      // Add completion time for this machine
      if (machineNumber === 1) updatedRun.endTime = completeTime
      if (machineNumber === 2) updatedRun.endTime = completeTime
      if (machineNumber === 3) updatedRun.endTime = completeTime
      if (machineNumber === 4) updatedRun.endTime = completeTime

      // Calculate the time difference if this is the bottleneck machine
      let timeDifference = 0

      // Check if this is the last required machine (all operations complete)
      const availableMachines = cellMachines
      const requiredMachineCount = Math.min(4, availableMachines.length)
      const completedMachineCount = [updatedRun.endTime]
        .slice(0, requiredMachineCount)
        .filter(Boolean).length

      // Mark as complete if all required machines have completed
      const isLastMachine = completedMachineCount === requiredMachineCount

      if (isLastMachine) {
        updatedRun.endTime = completeTime

        // Will trigger confetti when the production cycle is fully completed
        setTimeout(() => {
          triggerSuccess()
        }, 500)

        // Show a more celebratory toast for part completion
        toast({
          description: `Part ${part.partNumber} fully completed`
        })
      }

      // Update the running parts array
      updatedParts[runIndex] = updatedRun
      setRunningParts(updatedParts)

      // Recalculate efficiency after machine completion
      calculateEfficiency()
    } catch (error) {
      console.error("Error completing machine:", error)
      toast({
        description: "Failed to complete machine operation",
        variant: "destructive"
      })
    }
  }

  const handleCompleteStandardWork = (runId: string) => {
    try {
      // Find the run in the running parts array
      const runIndex = runningParts.findIndex(run => run.id === runId)
      if (runIndex === -1) {
        console.warn(`Could not find run with ID: ${runId}`)
        return
      }

      // Get the run and create a copy
      const run = runningParts[runIndex]
      const completeTime = new Date()
      const updatedRun = { ...run }

      // Find the associated part for logging
      const part = parts.find(p => p.id === run.partId)

      // Set the end time
      updatedRun.endTime = completeTime

      // Calculate actual time (in minutes) between start and completion
      const actualTime = completeTime.getTime() - run.startTime.getTime()
      const actualMinutes = Math.round(actualTime / (60 * 1000))

      // Update the actual time and time difference
      updatedRun.actualTime = actualMinutes
      updatedRun.timeDifference = actualMinutes - run.standardTime

      // Log the completion and any efficiency issues
      console.log(
        `Completed part ${run.partNumber} in ${actualMinutes} minutes (standard: ${run.standardTime} minutes)`
      )

      // Log potential issues for monitoring
      if (updatedRun.timeDifference > 0) {
        console.warn(
          `Part ${run.partNumber} completed ${updatedRun.timeDifference} minutes over standard time`
        )

        // If no reason is provided, prompt for one
        if (!updatedRun.reasonCategory) {
          toast({
            description: "Please add a reason for the time difference",
            variant: "destructive"
          })
        }
      } else if (updatedRun.timeDifference < 0) {
        // Log exceptionally good performance
        console.log(
          `Excellent performance: Part ${run.partNumber} completed ${Math.abs(updatedRun.timeDifference)} minutes under standard time`
        )
      }

      // Update the running parts array
      const updatedParts = [...runningParts]
      updatedParts[runIndex] = updatedRun
      setRunningParts(updatedParts)

      // Recalculate efficiency
      calculateEfficiency()

      // Try to save the data immediately
      if (activeShift?.id) {
        handleSaveScreen().catch(err => {
          console.error("Failed to auto-save after completion:", err)
        })
      }

      // Show success toast with more detailed information
      toast({
        description: `Completed part ${run.partNumber} in ${actualMinutes} minutes`
      })

      // Trigger confetti for parts completed under standard time
      if (updatedRun.timeDifference < 0) {
        setTimeout(() => {
          triggerSuccess()
        }, 300)
      }
    } catch (error) {
      console.error("Error completing standard work:", error)
      toast({
        description: "Failed to complete standard work",
        variant: "destructive"
      })
    }
  }

  const calculateEfficiency = () => {
    try {
      // Calculate total time differences (losses)
      let totalLossMinutes = 0
      let totalBreakMinutes = 0

      // Calculate based on the running parts
      runningParts.forEach(run => {
        if (run.timeDifference && run.timeDifference > 0) {
          totalLossMinutes += run.timeDifference
        }

        // Use the explicit break duration instead of assuming 30 min for each break
        totalBreakMinutes += run.breakDuration
      })

      // Calculate loss percentage
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
        totalStandardMinutes: 0,
        totalActualMinutes: 0,
        totalLossMinutes,
        totalBreakMinutes,
        lossPercentage: parseFloat(lossPercentage.toFixed(1)),
        efficiency: parseFloat(attainmentPercentage.toFixed(1))
      })
    } catch (error) {
      console.error("Failed to calculate efficiency", error)
    }
  }

  const handleSaveScreen = async () => {
    if (!activeShift?.id) {
      toast({
        description: "Start a shift before saving screen",
        variant: "destructive"
      })
      return
    }

    try {
      // Ensure we have the latest efficiency metrics
      calculateEfficiency()

      // Create production data object with additional metadata
      const productionData = JSON.stringify({
        runs: runningParts,
        metrics: metrics,
        cellId: selectedCell,
        savedAt: new Date().toISOString(),
        userId: userId,
        shiftType: shift
      })

      // Update only the production data without completing the shift
      const result = await updateShiftProductionDataAction(
        activeShift.id,
        productionData
      )

      if (result.isSuccess) {
        // Log successful save
        console.log(
          `Production data saved at ${new Date().toISOString()} for shift ${activeShift.id}, bottlenecks tracked: ${runningParts.filter(run => run.bottleneckMachine).length}`
        )

        // Track changes in efficiency metrics for logging
        if (metrics.efficiency < 75) {
          console.warn(
            `Low efficiency alert: ${metrics.efficiency.toFixed(1)}% for shift ${activeShift.id}`
          )
        }

        toast({
          description: "Production screen saved successfully"
        })

        // Additionally, let's add a debug log to display bottleneck information:
        if (runningParts.length > 0) {
          console.log(
            "Production runs with bottleneck info:",
            runningParts.map(run => ({
              partNumber: run.partNumber,
              bottleneckMachine: run.bottleneckMachine
            }))
          )
        }
      } else {
        console.error("Failed to save production data:", result.message)
        toast({
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error saving production screen:", error)
      toast({
        description: "Failed to save production screen",
        variant: "destructive"
      })
    }
  }

  // Initialize & fetch data
  useEffect(() => {
    // Only calculate efficiency if there are running parts
    if (runningParts.length > 0) {
      calculateEfficiency()
    }
  }, [runningParts.length])

  // Add the useEffect to call checkActiveShift on component mount
  useEffect(() => {
    checkActiveShift()
  }, [userId])

  // Get machine name by number
  const getMachineName = (machineNumber: number) => {
    if (cellMachines.length >= machineNumber) {
      return cellMachines[machineNumber - 1]?.name || `Machine ${machineNumber}`
    }
    return `Machine ${machineNumber}`
  }

  // Get machine index by ID
  const getMachineIndex = (machineId: string) => {
    return cellMachines.findIndex(m => m.id === machineId) + 1
  }

  // Get machine by index (1-based)
  const getMachineByIndex = (index: number) => {
    if (index > 0 && index <= cellMachines.length) {
      return cellMachines[index - 1]
    }
    return null
  }

  // Get machine status badge color
  const getMachineStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
      case "down":
        return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
      case "maintenance":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
      case "idle":
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
    }
  }

  // Get selected cell info
  const selectedCellInfo = cells.find(c => c.id === selectedCell)

  // Add missing handler functions
  const handleLunchBreakToggle = (runId: string, checked: boolean) => {
    setRunningParts(
      runningParts.map(run => {
        if (run.id === runId) {
          return { ...run, lunchBreak: checked }
        }
        return run
      })
    )

    // Recalculate efficiency
    calculateEfficiency()

    if (checked) {
      toast({
        description: "Lunch break logged"
      })
    }
  }

  const handleBreakDurationChange = (runId: string, duration: number) => {
    setRunningParts(
      runningParts.map(run => {
        if (run.id === runId) {
          const hasBreak = duration > 0
          return {
            ...run,
            breakDuration: duration,
            lunchBreak: hasBreak // Also update the lunchBreak flag for backwards compatibility
          }
        }
        return run
      })
    )

    // Recalculate efficiency
    calculateEfficiency()

    if (duration > 0) {
      toast({
        description: `${duration} minute break logged`
      })
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

  const handleReasonCategoryChange = (runId: string, category: string) => {
    setRunningParts(
      runningParts.map(run => {
        if (run.id === runId) {
          // Clear the custom reason if not selecting "other"
          const customReason =
            category === "other" ? run.reasonForTimeDifference : ""

          // Find the label for the selected category
          const reasonLabel =
            COMMON_REASONS.find(r => r.value === category)?.label || ""

          return {
            ...run,
            reasonCategory: category,
            // If not "other", use the label as the reason
            reasonForTimeDifference:
              category === "other" ? customReason : reasonLabel
          }
        }
        return run
      })
    )
  }

  // Helper to determine attainment color class
  const getAttainmentColor = (percentage: number): string => {
    if (percentage >= 95)
      return "text-green-600 dark:text-green-400 font-medium"
    if (percentage >= 80)
      return "text-emerald-600 dark:text-emerald-400 font-medium"
    if (percentage >= 70)
      return "text-amber-600 dark:text-amber-400 font-medium"
    return "text-red-600 dark:text-red-400 font-medium"
  }

  // Add production handler
  const handleAddProduction = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    toast({
      description: "Production entry feature coming soon!"
    })
  }

  return (
    <div className="space-y-4">
      {/* Bento Box Layout Container */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {/* Header Controls - Spans full width */}
        <div className="bg-card col-span-full rounded-xl border p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-end gap-4">
              {/* Cell Selection */}
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

              {/* Date Selection */}
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

              {/* Shift Selection */}
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

              {/* Shift Controls */}
              <div className="flex items-end gap-2">
                <Button
                  size="sm"
                  onClick={handleStartShift}
                  disabled={!selectedCell || shiftStartTime !== null}
                  className={cn(
                    "flex items-center gap-2 font-medium",
                    shiftStartTime !== null && "opacity-60"
                  )}
                >
                  <Play className="size-4" />
                  Start Shift
                </Button>

                {shiftStartTime !== null && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEndShift}
                    disabled={endingShift}
                    className="flex items-center gap-2 font-medium"
                  >
                    <StopCircle className="size-4" />
                    End Shift
                  </Button>
                )}
              </div>
            </div>

            {/* Right Controls */}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* Shift status */}
              {shiftStartTime !== null && (
                <div className="text-muted-foreground bg-muted/40 flex items-center rounded-md px-3 py-1 text-sm">
                  <Clock className="mr-1 size-4" />
                  <span>
                    Started: {format(shiftStartTime, "h:mm a")} (
                    {formatDuration(shiftStartTime)})
                  </span>
                </div>
              )}

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  router.push("/manufacturing/input")
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
                disabled={isSaving || runningParts.length === 0 || endingShift}
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
        </div>

        {/* Cell Info Card - 2 columns on mid screens, 2 columns on large screens */}
        {selectedCell ? (
          <div className="bg-card rounded-xl border p-4 shadow-sm md:col-span-2 lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center text-lg font-semibold">
                  <Building2 className="mr-2 inline-block size-5" />
                  {selectedCellInfo?.name || "Selected Cell"}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Cell ID: {selectedCell}
                </p>
                <div className="mt-2 flex items-center text-sm">
                  {shiftStartTime ? (
                    <Badge
                      variant="outline"
                      className="mr-2 border-green-500 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-900/50"
                    >
                      <Clock className="mr-1 size-3.5" />
                      Shift Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mr-2">
                      No Active Shift
                    </Badge>
                  )}
                  <span className="text-muted-foreground">
                    {shift} Shift{" "}
                    {shiftStartTime &&
                      `• Started ${format(shiftStartTime, "h:mm a")}`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => {
                    toast({
                      description: "Shift history feature coming soon!"
                    })
                  }}
                >
                  <History className="size-4" />
                  View History
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border p-4 shadow-sm md:col-span-2 lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div className="w-full">
                <div className="bg-muted/50 mb-2 h-6 w-3/4 animate-pulse rounded"></div>
                <div className="bg-muted/50 mb-3 h-4 w-1/2 animate-pulse rounded"></div>
                <div className="flex items-center gap-2">
                  <div className="bg-muted/50 h-6 w-24 animate-pulse rounded-full"></div>
                  <div className="bg-muted/50 h-4 w-32 animate-pulse rounded"></div>
                </div>
              </div>
              <div className="bg-muted/50 h-8 w-28 animate-pulse rounded"></div>
            </div>
          </div>
        )}

        {/* Efficiency Circle - 2 columns on mid screens, 1 column on large screens */}
        <div className="bg-card flex flex-col items-center justify-center rounded-xl border p-4 shadow-sm md:col-span-2 lg:col-span-1">
          <div className="text-muted-foreground mb-1 text-sm font-medium">
            Attainment (%)
          </div>
          <div className="relative mb-1 flex size-24 items-center justify-center md:size-32">
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-full text-4xl font-bold",
                metrics.efficiency >= 90
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                  : metrics.efficiency >= 75
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
              )}
            >
              {metrics.efficiency.toFixed(0)}
            </div>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="size-3 rounded-full bg-green-100 dark:bg-green-800"></div>
              <span>›90%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-3 rounded-full bg-amber-100 dark:bg-amber-800"></div>
              <span>›75%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-3 rounded-full bg-red-100 dark:bg-red-800"></div>
              <span>‹75%</span>
            </div>
          </div>
        </div>

        {/* Metrics Boxes - 4 columns on mid screens, 3 columns on large screens */}
        <div className="bg-card rounded-xl border p-4 shadow-sm md:col-span-4 lg:col-span-3">
          <h3 className="text-md mb-3 font-medium">Production Metrics</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="bg-muted/30 rounded-lg p-3">
              <span className="text-muted-foreground text-xs font-medium">
                Total Loss Mins
              </span>
              <span className="block text-2xl font-bold">
                {metrics.totalLossMinutes}
              </span>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <span className="text-muted-foreground text-xs font-medium">
                Break Minutes
              </span>
              <span className="block text-2xl font-bold">
                {metrics.totalBreakMinutes}
              </span>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <span className="text-muted-foreground text-xs font-medium">
                Loss + Breaks
              </span>
              <span className="block text-2xl font-bold">
                {metrics.totalLossMinutes + metrics.totalBreakMinutes}
              </span>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <span className="text-muted-foreground text-xs font-medium">
                Loss (%)
              </span>
              <span className="block text-2xl font-bold">
                {metrics.lossPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Bottleneck Analysis - 2 columns on mid screens, 3 columns on large screens */}
        <div className="bg-card overflow-hidden rounded-xl border shadow-sm md:col-span-2 lg:col-span-3">
          <div className="bg-muted/10 border-b p-4">
            <h3 className="font-medium">Bottleneck Analysis</h3>
            <p className="text-muted-foreground text-xs">
              How bottlenecks impact production in the "Make One, Move One"
              system
            </p>
          </div>
          <div className="p-4">
            {/* More compact Bottleneck Visualization */}
            <div className="overflow-x-auto">
              {selectedCell ? (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="border px-2 py-1 text-left">Part</th>
                      {cellMachines.slice(0, 2).map((machine, index) => (
                        <th
                          key={`bottleneck-header-${index}`}
                          className="border px-2 py-1 text-center"
                        >
                          {machine.name}
                        </th>
                      ))}
                      {cellMachines.length < 2 && (
                        <>
                          {Array.from({ length: 2 - cellMachines.length }).map(
                            (_, i) => (
                              <th
                                key={`empty-bottleneck-header-${i}`}
                                className="border px-2 py-1 text-center"
                              >
                                Machine {cellMachines.length + i + 1}
                              </th>
                            )
                          )}
                        </>
                      )}
                      <th className="border px-2 py-1 text-center">
                        Bottleneck
                      </th>
                      <th className="border px-2 py-1 text-left">Std Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.length > 0 ? (
                      parts.slice(0, 4).map((part, partIndex) => {
                        // Get cycle times for this part
                        const cycleTimes = [
                          part.cycleTimeMachine1 || 0,
                          part.cycleTimeMachine2 || 0,
                          part.cycleTimeMachine3 || 0,
                          part.cycleTimeMachine4 || 0
                        ].slice(0, Math.max(2, cellMachines.length))

                        // Calculate bottleneck machine and time
                        let bottleneckMachine = 0
                        let bottleneckTime = 0

                        cycleTimes.forEach((time, index) => {
                          if (time > bottleneckTime) {
                            bottleneckTime = time
                            bottleneckMachine = index + 1
                          }
                        })

                        // Alternating row colors
                        const bgColor =
                          partIndex % 2 === 0 ? "bg-background" : "bg-muted/10"

                        return (
                          <tr key={`bottleneck-${part.id}`} className={bgColor}>
                            <td className="border px-2 py-1 font-medium">
                              {part.partNumber}
                            </td>
                            <td
                              className={`border px-2 py-1 text-center ${bottleneckMachine === 1 ? "font-bold" : ""}`}
                            >
                              {part.cycleTimeMachine1 || "-"}
                            </td>
                            <td
                              className={`border px-2 py-1 text-center ${bottleneckMachine === 2 ? "font-bold" : ""}`}
                            >
                              {part.cycleTimeMachine2 || "-"}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {bottleneckTime > 0 ? (
                                <Badge className="border-amber-500 bg-amber-50 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                  Machine {bottleneckMachine}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="border px-2 py-1">
                              {bottleneckTime > 0
                                ? `${bottleneckTime} min`
                                : "-"}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-muted-foreground border p-2 text-center"
                        >
                          No parts with cycle time data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div>
                  {/* Skeleton table */}
                  <div className="w-full border-collapse">
                    <div className="bg-muted/30 mb-2 flex border">
                      <div className="w-1/5 border px-2 py-1 text-left">
                        <div className="bg-muted/50 h-4 w-16 animate-pulse rounded"></div>
                      </div>
                      <div className="w-1/5 border px-2 py-1 text-center">
                        <div className="bg-muted/50 mx-auto h-4 w-16 animate-pulse rounded"></div>
                      </div>
                      <div className="w-1/5 border px-2 py-1 text-center">
                        <div className="bg-muted/50 mx-auto h-4 w-16 animate-pulse rounded"></div>
                      </div>
                      <div className="w-1/5 border px-2 py-1 text-center">
                        <div className="bg-muted/50 mx-auto h-4 w-20 animate-pulse rounded"></div>
                      </div>
                      <div className="w-1/5 border px-2 py-1">
                        <div className="bg-muted/50 h-4 w-16 animate-pulse rounded"></div>
                      </div>
                    </div>
                    {[1, 2, 3, 4].map((_, index) => (
                      <div
                        key={index}
                        className={`flex border ${index % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                      >
                        <div className="w-1/5 border px-2 py-1">
                          <div className="bg-muted/50 h-4 w-20 animate-pulse rounded"></div>
                        </div>
                        <div className="w-1/5 border px-2 py-1 text-center">
                          <div className="bg-muted/50 mx-auto h-4 w-8 animate-pulse rounded"></div>
                        </div>
                        <div className="w-1/5 border px-2 py-1 text-center">
                          <div className="bg-muted/50 mx-auto h-4 w-8 animate-pulse rounded"></div>
                        </div>
                        <div className="w-1/5 border px-2 py-1 text-center">
                          <div className="bg-muted/50 mx-auto h-4 w-12 animate-pulse rounded"></div>
                        </div>
                        <div className="w-1/5 border px-2 py-1">
                          <div className="bg-muted/50 h-5 w-20 animate-pulse rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 text-xs">
              <p className="mb-1 font-medium">
                How Bottlenecks Are Calculated:
              </p>
              <ol className="list-decimal space-y-0.5 pl-5">
                <li>
                  The <strong>bottleneck machine</strong> is the one with the
                  longest cycle time
                </li>
                <li>
                  In "Make One, Move One", the bottleneck limits throughput
                </li>
                <li>
                  Standard work time is set by the bottleneck's cycle time
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Operations Info - Next to Bottleneck Analysis */}
        {selectedCell ? (
          <div className="bg-card overflow-hidden rounded-xl border shadow-sm md:col-span-2 lg:col-span-3">
            <div className="bg-muted/10 flex items-center justify-between border-b p-4">
              <h3 className="font-medium">Operations</h3>
              <span className="text-muted-foreground text-xs">
                {isLoadingMachines
                  ? "Loading operations..."
                  : `${cellMachines.length} operations found`}
              </span>
            </div>

            <div className="p-4">
              {isLoadingMachines ? (
                <div className="flex h-24 items-center justify-center space-x-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  <span className="text-sm">Loading operations...</span>
                </div>
              ) : cellMachines.length === 0 ? (
                <div className="flex h-24 items-center justify-center space-x-2 text-amber-500 dark:text-amber-400">
                  <AlertCircle className="size-4" />
                  <span className="text-sm">
                    No operations found for this cell. Please set up machines
                    first.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
                  {cellMachines.map((machine, index) => (
                    <div
                      key={machine.id}
                      className={`bg-background rounded-md border p-3 ${index < 4 ? "ring-primary/20 ring-1" : ""}`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-sm font-medium">
                          Op {index + 1}: {machine.name}
                        </div>
                        <div
                          className={`rounded-full px-1.5 py-0.5 text-xs ${getMachineStatusColor(machine.status)}`}
                        >
                          {machine.status}
                        </div>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Machine Type: {machine.machineType || "Not specified"}
                      </div>
                      {machine.standardCycleTime ? (
                        <div className="mt-1 text-xs">
                          <span className="font-medium">Std Cycle:</span>{" "}
                          {machine.standardCycleTime} min
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card overflow-hidden rounded-xl border shadow-sm md:col-span-2 lg:col-span-3">
            <div className="bg-muted/10 flex items-center justify-between border-b p-4">
              <div className="bg-muted/50 h-5 w-24 animate-pulse rounded"></div>
              <div className="bg-muted/50 h-4 w-32 animate-pulse rounded"></div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
                {[1, 2, 3, 4].map((_, index) => (
                  <div
                    key={index}
                    className="bg-background rounded-md border p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="bg-muted/50 h-4 w-28 animate-pulse rounded"></div>
                      <div className="bg-muted/50 h-4 w-16 animate-pulse rounded-full"></div>
                    </div>
                    <div className="bg-muted/50 mb-2 h-3 w-3/4 animate-pulse rounded"></div>
                    <div className="bg-muted/50 h-3 w-1/2 animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Production Tracker - Full width */}
        <div className="bg-card overflow-hidden rounded-xl border shadow-sm lg:col-span-6">
          <div className="bg-muted/10 flex items-center justify-between border-b p-4">
            <h3 className="font-medium">Production Tracking</h3>
          </div>

          {selectedCell ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-16">Qty</TableHead>
                    <TableHead className="w-16">Std Time</TableHead>
                    <TableHead className="w-16">Actual</TableHead>
                    <TableHead className="w-44 text-center">Complete</TableHead>
                    <TableHead className="w-16">+/-</TableHead>
                    <TableHead className="w-28">Break</TableHead>
                    <TableHead className="w-28">Bottleneck</TableHead>
                    <TableHead>Reason For Difference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runningParts.map((run, index) => (
                    <TableRow
                      key={index}
                      className={cn(
                        run.endTime ? "bg-green-50 dark:bg-green-950/20" : "",
                        "group transition-colors duration-100"
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {run.endTime ? (
                            <div className="rounded-full bg-green-100 p-1 text-green-800 dark:bg-green-900/60 dark:text-green-300">
                              <CheckCircle2 className="size-4" />
                            </div>
                          ) : (
                            <div className="rounded-full bg-blue-100 p-1 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                              <Clock className="size-4" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{run.partNumber}</TableCell>
                      <TableCell>{run.partName}</TableCell>
                      <TableCell>{run.quantity}</TableCell>
                      <TableCell>{run.standardTime}</TableCell>
                      <TableCell>{run.actualTime}</TableCell>
                      <TableCell>
                        {run.endTime ? (
                          <div className="flex items-center justify-center space-x-2">
                            <CheckCircle2 className="size-5 text-green-500" />
                            <span className="text-sm font-medium text-green-600">
                              Completed at{" "}
                              {format(new Date(run.endTime), "h:mm a")}
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleCompleteStandardWork(run.id)}
                              className="px-4"
                            >
                              Complete
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-medium",
                          run.timeDifference != null && run.timeDifference > 0
                            ? "text-destructive"
                            : "",
                          run.timeDifference != null && run.timeDifference < 0
                            ? "text-green-600 dark:text-green-500"
                            : ""
                        )}
                      >
                        {run.timeDifference != null && run.timeDifference !== 0
                          ? run.timeDifference
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={run.breakDuration.toString()}
                          onValueChange={value => {
                            const duration = parseInt(value)
                            handleBreakDurationChange(run.id, duration)
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None</SelectItem>
                            {BREAK_DURATIONS.map(duration => (
                              <SelectItem
                                key={duration.value}
                                value={duration.value.toString()}
                              >
                                {duration.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {run.bottleneckMachine ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          >
                            Machine {run.bottleneckMachine}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={run.reasonCategory}
                            onValueChange={value =>
                              handleReasonCategoryChange(run.id, value)
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select reason..." />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_REASONS.map(reason => (
                                <SelectItem
                                  key={reason.value}
                                  value={reason.value}
                                >
                                  {reason.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {run.reasonCategory === "other" && (
                            <Input
                              value={run.reasonForTimeDifference}
                              onChange={e =>
                                handleReasonChange(run.id, e.target.value)
                              }
                              placeholder="Specify reason..."
                              className="h-8 flex-1"
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={11} className="p-2">
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
                              handleAddPart(
                                parts.find(p => p.id === value) as SelectPart,
                                0
                              )
                              // Increment the key to force a re-render of the Select component
                              setSelectKey(prev => prev + 1)
                            }}
                          >
                            <SelectTrigger
                              id="part-select"
                              className={`w-64 ${!selectedCell || cellMachines.length === 0 ? "opacity-50" : ""}`}
                              disabled={
                                !selectedCell || cellMachines.length === 0
                              }
                            >
                              <SelectValue
                                placeholder={
                                  !selectedCell
                                    ? "Select a cell first"
                                    : cellMachines.length === 0
                                      ? "No machines available for this cell"
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
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-4">
              {/* Skeleton Production Tracking Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10">
                        <div className="bg-muted/50 mx-auto size-4 animate-pulse rounded-full"></div>
                      </TableHead>
                      <TableHead>
                        <div className="bg-muted/50 h-4 w-24 animate-pulse rounded"></div>
                      </TableHead>
                      <TableHead>
                        <div className="bg-muted/50 h-4 w-32 animate-pulse rounded"></div>
                      </TableHead>
                      <TableHead className="w-16">
                        <div className="bg-muted/50 mx-auto h-4 w-8 animate-pulse rounded"></div>
                      </TableHead>
                      <TableHead className="w-16">
                        <div className="bg-muted/50 mx-auto h-4 w-12 animate-pulse rounded"></div>
                      </TableHead>
                      <TableHead className="w-16">
                        <div className="bg-muted/50 mx-auto h-4 w-12 animate-pulse rounded"></div>
                      </TableHead>
                      <TableHead className="w-44 text-center">
                        <div className="bg-muted/50 mx-auto h-4 w-24 animate-pulse rounded"></div>
                      </TableHead>
                      <TableHead className="w-16">
                        <div className="bg-muted/50 mx-auto h-4 w-8 animate-pulse rounded"></div>
                      </TableHead>
                      <TableHead className="w-28">
                        <div className="bg-muted/50 mx-auto h-4 w-16 animate-pulse rounded"></div>
                      </TableHead>
                      <TableHead className="w-28">
                        <div className="bg-muted/50 mx-auto h-4 w-20 animate-pulse rounded"></div>
                      </TableHead>
                      <TableHead>
                        <div className="bg-muted/50 h-4 w-36 animate-pulse rounded"></div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3].map((_, index) => (
                      <TableRow
                        key={index}
                        className="group transition-colors duration-100"
                      >
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <div className="bg-muted/50 mx-auto size-8 animate-pulse rounded-full"></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="bg-muted/50 h-4 w-20 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="bg-muted/50 h-4 w-24 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="bg-muted/50 h-4 w-6 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="bg-muted/50 h-4 w-8 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="bg-muted/50 h-4 w-8 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <div className="bg-muted/50 h-8 w-24 animate-pulse rounded"></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="bg-muted/50 h-4 w-6 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="bg-muted/50 h-8 w-20 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="bg-muted/50 h-6 w-24 animate-pulse rounded-full"></div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <div className="bg-muted/50 h-8 w-36 animate-pulse rounded"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={11} className="p-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="bg-muted/50 h-4 w-20 animate-pulse rounded"></div>
                            <div className="bg-muted/50 h-10 w-64 animate-pulse rounded"></div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
