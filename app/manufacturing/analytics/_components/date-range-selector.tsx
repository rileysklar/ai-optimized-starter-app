"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format, parse } from "date-fns"
import { cn } from "@/lib/utils"

interface DateRangeSelectorProps {
  defaultStartDate: string
  defaultEndDate: string
}

export function DateRangeSelector({
  defaultStartDate,
  defaultEndDate
}: DateRangeSelectorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Parse string dates to Date objects
  const parseDate = (dateStr: string) => {
    return parse(dateStr, "yyyy-MM-dd", new Date())
  }

  const [startDate, setStartDate] = useState<Date | undefined>(
    parseDate(defaultStartDate)
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    parseDate(defaultEndDate)
  )

  // Handle date selection and update URL
  const handleDateChange = (start?: Date, end?: Date) => {
    const newStart = start || startDate
    const newEnd = end || endDate

    if (newStart && newEnd) {
      startTransition(() => {
        router.push(
          `/manufacturing/analytics?startDate=${format(newStart, "yyyy-MM-dd")}&endDate=${format(
            newEnd,
            "yyyy-MM-dd"
          )}`
        )
      })
    }
  }

  // Quick date range selections
  const setLastWeek = () => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - 7)

    setStartDate(start)
    setEndDate(today)
    handleDateChange(start, today)
  }

  const setLastMonth = () => {
    const today = new Date()
    const start = new Date(today)
    start.setMonth(today.getMonth() - 1)

    setStartDate(start)
    setEndDate(today)
    handleDateChange(start, today)
  }

  const setLastQuarter = () => {
    const today = new Date()
    const start = new Date(today)
    start.setMonth(today.getMonth() - 3)

    setStartDate(start)
    setEndDate(today)
    handleDateChange(start, today)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[130px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
              disabled={isPending}
            >
              <CalendarIcon className="mr-2 size-4" />
              {startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={date => {
                setStartDate(date)
                if (date && endDate) {
                  handleDateChange(date, endDate)
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[130px] justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
              disabled={isPending}
            >
              <CalendarIcon className="mr-2 size-4" />
              {endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={date => {
                setEndDate(date)
                if (startDate && date) {
                  handleDateChange(startDate, date)
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={setLastWeek}
          disabled={isPending}
        >
          Week
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={setLastMonth}
          disabled={isPending}
        >
          Month
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={setLastQuarter}
          disabled={isPending}
        >
          Quarter
        </Button>
      </div>
    </div>
  )
}
