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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [activeTab, setActiveTab] = useState<string>("week")

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
    setActiveTab("week")
    handleDateChange(start, today)
  }

  const setLastMonth = () => {
    const today = new Date()
    const start = new Date(today)
    start.setMonth(today.getMonth() - 1)

    setStartDate(start)
    setEndDate(today)
    setActiveTab("month")
    handleDateChange(start, today)
  }

  const setLastQuarter = () => {
    const today = new Date()
    const start = new Date(today)
    start.setMonth(today.getMonth() - 3)

    setStartDate(start)
    setEndDate(today)
    setActiveTab("quarter")
    handleDateChange(start, today)
  }

  return (
    <div className="bg-background flex w-full flex-wrap items-center gap-3 rounded-md border p-2">
      <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[calc(50%-10px)] justify-start text-left font-normal",
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
                "w-[calc(50%-10px)] justify-start text-left font-normal",
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

      <div className="ml-1 hidden h-8 border-l pl-3 sm:block" />

      <Tabs value={activeTab} className="w-auto">
        <TabsList>
          <TabsTrigger value="week" onClick={setLastWeek} disabled={isPending}>
            Week
          </TabsTrigger>
          <TabsTrigger
            value="month"
            onClick={setLastMonth}
            disabled={isPending}
          >
            Month
          </TabsTrigger>
          <TabsTrigger
            value="quarter"
            onClick={setLastQuarter}
            disabled={isPending}
          >
            Quarter
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
