"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { calculateMachineEfficiencyAction } from "@/actions/db/efficiency-metrics-actions"
import { CalendarIcon, RefreshCw } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { format, addDays, eachDayOfInterval } from "date-fns"
import { cn } from "@/app/manufacturing/lib/utils"
import { toast } from "sonner"

interface BatchMetricsCalculatorProps {
  cellId: string
}

export function BatchMetricsCalculator({
  cellId
}: BatchMetricsCalculatorProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(
    addDays(new Date(), 7)
  )
  const [isCalculating, setIsCalculating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleCalculate = async () => {
    if (!startDate || !endDate || !cellId) {
      toast.error("Please select start and end dates")
      return
    }

    if (endDate < startDate) {
      toast.error("End date must be after start date")
      return
    }

    setIsCalculating(true)
    setResult(null)
    setProgress(0)

    try {
      // Generate array of all dates between start and end
      const dateRange = eachDayOfInterval({
        start: startDate,
        end: endDate
      })

      // Track progress
      let completed = 0
      const total = dateRange.length

      // Process each date
      for (const date of dateRange) {
        const formattedDate = format(date, "yyyy-MM-dd")

        try {
          // Calculate efficiency metrics for this date
          await calculateMachineEfficiencyAction({
            cellId,
            date: formattedDate
          })

          // Update progress
          completed++
          setProgress(Math.round((completed / total) * 100))
        } catch (dateError) {
          console.error(`Error processing date ${formattedDate}:`, dateError)
          // Continue with other dates
        }
      }

      setResult({
        success: true,
        message: `Successfully calculated metrics for ${completed} out of ${total} dates`
      })

      toast.success("Batch calculation completed")

      // Refresh the page to show updated metrics
      window.location.reload()
    } catch (error) {
      console.error("Error in batch calculation:", error)
      setResult({
        success: false,
        message: "An error occurred during batch calculation"
      })
      toast.error("Failed to complete batch calculation")
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Calculate Metrics</CardTitle>
        <CardDescription>
          Calculate efficiency metrics for a range of dates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="startDate" className="text-sm font-medium">
              Start Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="startDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {startDate ? (
                    format(startDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="endDate" className="text-sm font-medium">
              End Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="endDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {isCalculating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleCalculate}
          disabled={isCalculating || !startDate || !endDate || !cellId}
          className="w-full"
        >
          {isCalculating ? (
            <>
              <RefreshCw className="mr-2 size-4 animate-spin" />
              Calculating ({progress}%)...
            </>
          ) : (
            "Calculate Metrics for Date Range"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
