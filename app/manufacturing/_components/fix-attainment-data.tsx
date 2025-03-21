"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { recalculateAttainmentAction } from "@/actions/db/efficiency-metrics-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface FixAttainmentDataProps {
  cellId: string
  startDate?: string
  endDate?: string
}

export function FixAttainmentData({
  cellId,
  startDate,
  endDate
}: FixAttainmentDataProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [recordsUpdated, setRecordsUpdated] = useState<number | null>(null)

  const handleFixAttainment = async () => {
    if (!cellId) {
      toast.error("Please select a cell first")
      return
    }

    setIsLoading(true)
    setRecordsUpdated(null)

    try {
      const dateRange =
        startDate && endDate ? { startDate, endDate } : undefined
      const result = await recalculateAttainmentAction(cellId, dateRange)

      if (result.isSuccess) {
        toast.success(result.message)
        setRecordsUpdated(result.data?.updated ?? 0)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error fixing attainment data:", error)
      toast.error("An unexpected error occurred while fixing attainment data")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleFixAttainment}
        disabled={isLoading || !cellId}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Fix Attainment Data"
        )}
      </Button>

      {recordsUpdated !== null && (
        <p className="text-muted-foreground text-xs">
          {recordsUpdated} records updated
        </p>
      )}
    </div>
  )
}
