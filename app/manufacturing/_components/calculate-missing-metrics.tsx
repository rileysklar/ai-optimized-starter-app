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
import { format } from "date-fns"
import { cn } from "@/app/manufacturing/lib/utils"
import { toast } from "sonner"

interface CalculateMissingMetricsProps {
  cellId: string
}

export function CalculateMissingMetrics({
  cellId
}: CalculateMissingMetricsProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleCalculate = async () => {
    if (!selectedDate || !cellId) {
      toast.error("Please select a date and cell")
      return
    }

    setIsCalculating(true)
    setResult(null)

    try {
      // Format the date as YYYY-MM-DD
      const formattedDate = format(selectedDate, "yyyy-MM-dd")

      // Call the action to calculate efficiency metrics for this date
      const response = await calculateMachineEfficiencyAction({
        cellId,
        date: formattedDate
      })

      if (response.isSuccess) {
        setResult({
          success: true,
          message: `Successfully calculated metrics for ${formattedDate}`
        })
        toast.success("Efficiency metrics calculated successfully")
      } else {
        setResult({
          success: false,
          message: response.message || "Failed to calculate metrics"
        })
        toast.error(response.message || "Failed to calculate metrics")
      }
    } catch (error) {
      console.error("Error calculating metrics:", error)
      setResult({
        success: false,
        message: "An unexpected error occurred"
      })
      toast.error("Failed to calculate metrics. Please try again.")
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculate Missing Metrics</CardTitle>
        <CardDescription>
          Generate efficiency metrics for dates with production logs but no
          metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-1.5">
          <label htmlFor="date" className="text-sm font-medium">
            Select Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleCalculate}
          disabled={isCalculating || !selectedDate || !cellId}
          className="w-full"
        >
          {isCalculating ? (
            <>
              <RefreshCw className="mr-2 size-4 animate-spin" />
              Calculating...
            </>
          ) : (
            "Calculate Metrics"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
