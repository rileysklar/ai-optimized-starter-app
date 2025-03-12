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
import { CalendarIcon, RefreshCw, AlertCircle } from "lucide-react"
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
  onComplete?: () => void
}

export function BatchMetricsCalculator({
  cellId,
  onComplete
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
    processedDates?: number
    totalDates?: number
    skippedDates?: number
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
      let skipped = 0
      const total = dateRange.length

      // Process each date
      for (const date of dateRange) {
        const formattedDate = format(date, "yyyy-MM-dd")

        try {
          // Calculate efficiency metrics for this date
          const result = await calculateMachineEfficiencyAction({
            cellId,
            date: formattedDate
          })

          // Check if metrics were calculated or if there was no data
          if (result.isSuccess) {
            completed++
          } else {
            // If calculation failed because no production logs were found
            if (result.message.includes("No production logs found")) {
              skipped++
            }
          }

          // Update progress
          setProgress(Math.round(((completed + skipped) / total) * 100))
        } catch (dateError) {
          console.error(`Error processing date ${formattedDate}:`, dateError)
          skipped++
          setProgress(Math.round(((completed + skipped) / total) * 100))
          // Continue with other dates
        }
      }

      setResult({
        success: true,
        message: `Successfully calculated metrics for ${completed} out of ${total} dates`,
        processedDates: completed,
        totalDates: total,
        skippedDates: skipped
      })

      if (completed > 0) {
        toast.success(`Metrics calculated for ${completed} dates`)
        // Call the onComplete callback if provided to refresh the parent component
        if (onComplete) {
          onComplete()
        }
      } else {
        toast.warning("No metrics calculated - no production data found")
      }

      // Don't refresh the page, let parent component handle refresh
      // Instead, trigger an event or use a callback
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
        <CardTitle>Calculate Metrics</CardTitle>
        <CardDescription>
          Generate efficiency metrics from production data
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
                    format(startDate, "MM/dd/yyyy")
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
                  {endDate ? (
                    format(endDate, "MM/dd/yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
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
            <AlertDescription className="flex flex-col gap-1">
              <p>{result.message}</p>
              {result.processedDates !== undefined && (
                <div className="text-muted-foreground mt-1 text-xs">
                  <p>• {result.processedDates} dates with data processed</p>
                  {result.skippedDates !== undefined &&
                    result.skippedDates > 0 && (
                      <p>
                        • {result.skippedDates} dates skipped (no production
                        data)
                      </p>
                    )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!isCalculating && !result && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
            <AlertCircle className="size-4 text-blue-500" />
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              This will calculate efficiency metrics based on production data.
              Make sure you have logged production for these dates.
            </AlertDescription>
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
            "Calculate Metrics"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
