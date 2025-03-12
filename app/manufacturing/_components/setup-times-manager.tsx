"use client"

import {
  updateSetupTimesAction,
  createSetupTimesAction
} from "@/actions/db/setup-times-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { SelectCell } from "@/db/schema"
import { PlusCircle, Save } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface SetupTime {
  id: string
  cellId: string
  setupTimeMachine1: number
  setupTimeMachine2: number
  setupTimeMachine3: number
  setupTimeMachine4: number
  date: string
}

interface SetupTimesManagerProps {
  userId: string
  initialCells: SelectCell[]
  initialSetupTimes: SetupTime[]
}

export function SetupTimesManager({
  userId,
  initialCells,
  initialSetupTimes = []
}: SetupTimesManagerProps) {
  // State
  const [selectedCell, setSelectedCell] = useState<string>("")
  const [setupTimes, setSetupTimes] = useState<SetupTime[]>(initialSetupTimes)
  const [newSetupTime, setNewSetupTime] = useState({
    setupTimeMachine1: "10",
    setupTimeMachine2: "10",
    setupTimeMachine3: "10",
    setupTimeMachine4: "10"
  })
  const [isSaving, setIsSaving] = useState(false)

  // Get current setup times for selected cell
  const currentSetupTime = selectedCell
    ? setupTimes.find(st => st.cellId === selectedCell)
    : undefined

  // Handle cell selection
  const handleCellChange = (cellId: string) => {
    setSelectedCell(cellId)

    // Reset new setup time form when cell changes
    if (!setupTimes.some(st => st.cellId === cellId)) {
      setNewSetupTime({
        setupTimeMachine1: "10",
        setupTimeMachine2: "10",
        setupTimeMachine3: "10",
        setupTimeMachine4: "10"
      })
    }
  }

  // Handle input changes for new setup times
  const handleInputChange = (machine: string, value: string) => {
    setNewSetupTime(prev => ({
      ...prev,
      [machine]: value
    }))
  }

  // Handle save setup times
  const handleSaveSetupTimes = async () => {
    if (!selectedCell) {
      toast.error("Please select a cell first")
      return
    }

    setIsSaving(true)

    try {
      const setupTimeData = {
        cellId: selectedCell,
        setupTimeMachine1: parseInt(newSetupTime.setupTimeMachine1, 10),
        setupTimeMachine2: parseInt(newSetupTime.setupTimeMachine2, 10),
        setupTimeMachine3: parseInt(newSetupTime.setupTimeMachine3, 10),
        setupTimeMachine4: parseInt(newSetupTime.setupTimeMachine4, 10),
        date: new Date().toISOString().split("T")[0]
      }

      const result = currentSetupTime
        ? await updateSetupTimesAction(currentSetupTime.id, setupTimeData)
        : await createSetupTimesAction(setupTimeData)

      if (result.isSuccess) {
        toast.success("Setup times saved successfully")

        if (currentSetupTime) {
          // Update existing setup time in the state
          setSetupTimes(
            setupTimes.map(st =>
              st.id === currentSetupTime.id ? result.data : st
            )
          )
        } else {
          // Add new setup time to the state
          setSetupTimes([...setupTimes, result.data])
        }
      } else {
        toast.error(result.message || "Failed to save setup times")
      }
    } catch (error) {
      console.error("Error saving setup times:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Machine Setup Times</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cell-select">Select Cell</Label>
            <Select value={selectedCell} onValueChange={handleCellChange}>
              <SelectTrigger id="cell-select" className="w-64">
                <SelectValue placeholder="Select a cell" />
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

          {selectedCell && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4">
                <div></div>
                <Label className="text-center">Machine 1 (T1)</Label>
                <Label className="text-center">Machine 2 (T2)</Label>
                <Label className="text-center">Machine 3 (G)</Label>
                <Label className="text-center">Machine 4 (M)</Label>
              </div>

              <div className="grid grid-cols-5 items-center gap-4">
                <Label>Setup Time (min)</Label>
                <Input
                  type="number"
                  min="0"
                  value={
                    currentSetupTime
                      ? currentSetupTime.setupTimeMachine1
                      : newSetupTime.setupTimeMachine1
                  }
                  onChange={e =>
                    handleInputChange("setupTimeMachine1", e.target.value)
                  }
                />
                <Input
                  type="number"
                  min="0"
                  value={
                    currentSetupTime
                      ? currentSetupTime.setupTimeMachine2
                      : newSetupTime.setupTimeMachine2
                  }
                  onChange={e =>
                    handleInputChange("setupTimeMachine2", e.target.value)
                  }
                />
                <Input
                  type="number"
                  min="0"
                  value={
                    currentSetupTime
                      ? currentSetupTime.setupTimeMachine3
                      : newSetupTime.setupTimeMachine3
                  }
                  onChange={e =>
                    handleInputChange("setupTimeMachine3", e.target.value)
                  }
                />
                <Input
                  type="number"
                  min="0"
                  value={
                    currentSetupTime
                      ? currentSetupTime.setupTimeMachine4
                      : newSetupTime.setupTimeMachine4
                  }
                  onChange={e =>
                    handleInputChange("setupTimeMachine4", e.target.value)
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSetupTimes}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="size-4" />
                  {isSaving
                    ? "Saving..."
                    : currentSetupTime
                      ? "Update Setup Times"
                      : "Save Setup Times"}
                </Button>
              </div>
            </div>
          )}

          {setupTimes.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-medium">Current Setup Times</h3>
              <div className="bg-muted mb-2 grid grid-cols-5 gap-4 rounded-md p-2">
                <div className="font-medium">Cell</div>
                <div className="text-center font-medium">T1 (min)</div>
                <div className="text-center font-medium">T2 (min)</div>
                <div className="text-center font-medium">G (min)</div>
                <div className="text-center font-medium">M (min)</div>
              </div>

              {setupTimes.map((setup, index) => {
                const cell = initialCells.find(c => c.id === setup.cellId)
                return (
                  <div
                    key={setup.id}
                    className={`grid grid-cols-5 gap-4 p-2 ${
                      index % 2 === 0 ? "bg-muted/50" : ""
                    } rounded-md`}
                  >
                    <div>{cell?.name || "Unknown Cell"}</div>
                    <div className="text-center">{setup.setupTimeMachine1}</div>
                    <div className="text-center">{setup.setupTimeMachine2}</div>
                    <div className="text-center">{setup.setupTimeMachine3}</div>
                    <div className="text-center">{setup.setupTimeMachine4}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
