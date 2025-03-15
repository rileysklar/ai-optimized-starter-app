"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { SelectCell, SelectValueStream } from "@/db/schema"

// Define a constant for the "all" value
const ALL_VALUE_STREAMS = "all-value-streams"

interface HierarchySelectorProps {
  cells: SelectCell[]
  valueStreams: SelectValueStream[]
  defaultCellId: string
}

export function HierarchySelector({
  cells,
  valueStreams,
  defaultCellId
}: HierarchySelectorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedValueStream, setSelectedValueStream] =
    useState<string>(ALL_VALUE_STREAMS)
  const [selectedCell, setSelectedCell] = useState<string>(defaultCellId)

  // Filter cells by value stream
  const filteredCells =
    selectedValueStream && selectedValueStream !== ALL_VALUE_STREAMS
      ? cells.filter(cell => cell.valueStreamId === selectedValueStream)
      : cells

  // Handle value stream change
  const handleValueStreamChange = (value: string) => {
    setSelectedValueStream(value)

    // If "all value streams" is selected, don't filter by value stream
    if (value === ALL_VALUE_STREAMS) {
      // If there are cells available, select the first one
      if (cells.length > 0) {
        setSelectedCell(cells[0].id)

        // Update URL parameters - remove valueStreamId
        startTransition(() => {
          router.push(`/manufacturing/analytics?cellId=${cells[0].id}`)
        })
      }
      return
    }

    // If there are cells in this value stream, select the first one
    const cellsInValueStream = cells.filter(
      cell => cell.valueStreamId === value
    )

    if (cellsInValueStream.length > 0) {
      setSelectedCell(cellsInValueStream[0].id)

      // Update URL parameters
      startTransition(() => {
        router.push(
          `/manufacturing/analytics?valueStreamId=${value}&cellId=${cellsInValueStream[0].id}`
        )
      })
    }
  }

  // Handle cell change
  const handleCellChange = (value: string) => {
    setSelectedCell(value)

    // Find the value stream for this cell
    const cell = cells.find(c => c.id === value)
    if (cell) {
      setSelectedValueStream(cell.valueStreamId)
    }

    // Update URL parameters
    startTransition(() => {
      router.push(`/manufacturing/analytics?cellId=${value}`)
    })
  }

  return (
    <div className="bg-background flex w-full flex-wrap items-center gap-3 rounded-md border p-2">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <Select
          value={selectedValueStream}
          onValueChange={handleValueStreamChange}
        >
          <SelectTrigger
            className="w-[200px] min-w-[200px] flex-1 md:w-auto"
            disabled={isPending}
          >
            <SelectValue placeholder="All Value Streams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE_STREAMS}>All Value Streams</SelectItem>
            {valueStreams.map(vs => (
              <SelectItem key={vs.id} value={vs.id}>
                {vs.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCell} onValueChange={handleCellChange}>
          <SelectTrigger
            className="w-[180px] min-w-[180px] flex-1 md:w-auto"
            disabled={isPending || cells.length === 0}
          >
            <SelectValue
              placeholder={
                cells.length === 0 ? "No Cells Available" : "Select Cell"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {filteredCells.map(cell => (
              <SelectItem key={cell.id} value={cell.id}>
                {cell.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
