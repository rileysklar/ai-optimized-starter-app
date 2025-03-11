"use client"

import { createPartAction, updatePartAction } from "@/actions/db/parts-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useState } from "react"
import { toast } from "sonner"

interface NewPartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPartAdded: (part: any) => void
  editPart?: any
}

export function NewPartDialog({
  open,
  onOpenChange,
  onPartAdded,
  editPart
}: NewPartDialogProps) {
  // Form state
  const [partNumber, setPartNumber] = useState(editPart?.partNumber || "")
  const [description, setDescription] = useState(editPart?.description || "")
  const [cycleTime1, setCycleTime1] = useState(
    editPart?.cycleTimeMachine1?.toString() || "10"
  )
  const [cycleTime2, setCycleTime2] = useState(
    editPart?.cycleTimeMachine2?.toString() || "10"
  )
  const [cycleTime3, setCycleTime3] = useState(
    editPart?.cycleTimeMachine3?.toString() || "10"
  )
  const [cycleTime4, setCycleTime4] = useState(
    editPart?.cycleTimeMachine4?.toString() || "10"
  )
  const [bottleneckMachine, setBottleneckMachine] = useState(
    editPart?.bottleneckMachine?.toString() || "1"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!partNumber || !description) {
      toast.error("Part number and description are required")
      return
    }

    setIsSubmitting(true)

    try {
      // Convert string inputs to numbers
      const cycleTime1Num = parseInt(cycleTime1, 10)
      const cycleTime2Num = parseInt(cycleTime2, 10)
      const cycleTime3Num = parseInt(cycleTime3, 10)
      const cycleTime4Num = parseInt(cycleTime4, 10)
      const bottleneckMachineNum = parseInt(bottleneckMachine, 10)

      const partData = {
        partNumber,
        description,
        cycleTimeMachine1: cycleTime1Num,
        cycleTimeMachine2: cycleTime2Num,
        cycleTimeMachine3: cycleTime3Num,
        cycleTimeMachine4: cycleTime4Num,
        bottleneckMachine: bottleneckMachineNum,
        // Determine bottleneck if not manually set
        ...(bottleneckMachine === "0" && {
          bottleneckMachine:
            [
              cycleTime1Num,
              cycleTime2Num,
              cycleTime3Num,
              cycleTime4Num
            ].indexOf(
              Math.max(
                cycleTime1Num,
                cycleTime2Num,
                cycleTime3Num,
                cycleTime4Num
              )
            ) + 1
        })
      }

      const result = editPart
        ? await updatePartAction(editPart.id, partData)
        : await createPartAction(partData)

      if (result.isSuccess) {
        toast.success(
          editPart ? "Part updated successfully" : "New part added successfully"
        )
        onPartAdded(result.data)
        resetForm()
        onOpenChange(false)
      } else {
        toast.error(result.message || "Failed to save part")
      }
    } catch (error) {
      console.error("Error saving part:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    if (!editPart) {
      setPartNumber("")
      setDescription("")
      setCycleTime1("10")
      setCycleTime2("10")
      setCycleTime3("10")
      setCycleTime4("10")
      setBottleneckMachine("1")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editPart ? "Edit Part" : "Add New Part"}</DialogTitle>
            <DialogDescription>
              {editPart
                ? "Update the part details below"
                : "Fill in the part details to add it to the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="partNumber">Part Number</Label>
                <Input
                  id="partNumber"
                  value={partNumber}
                  onChange={e => setPartNumber(e.target.value)}
                  placeholder="Enter part number"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Enter part description"
                  required
                />
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">
                Cycle Times (minutes)
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cycleTime1">Machine 1</Label>
                  <Input
                    id="cycleTime1"
                    type="number"
                    value={cycleTime1}
                    onChange={e => setCycleTime1(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="cycleTime2">Machine 2</Label>
                  <Input
                    id="cycleTime2"
                    type="number"
                    value={cycleTime2}
                    onChange={e => setCycleTime2(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="cycleTime3">Machine 3</Label>
                  <Input
                    id="cycleTime3"
                    type="number"
                    value={cycleTime3}
                    onChange={e => setCycleTime3(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="cycleTime4">Machine 4</Label>
                  <Input
                    id="cycleTime4"
                    type="number"
                    value={cycleTime4}
                    onChange={e => setCycleTime4(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bottleneckMachine">Bottleneck Machine</Label>
              <Select
                value={bottleneckMachine}
                onValueChange={setBottleneckMachine}
              >
                <SelectTrigger id="bottleneckMachine">
                  <SelectValue placeholder="Select bottleneck machine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    Auto-detect (based on cycle times)
                  </SelectItem>
                  <SelectItem value="1">Machine 1</SelectItem>
                  <SelectItem value="2">Machine 2</SelectItem>
                  <SelectItem value="3">Machine 3</SelectItem>
                  <SelectItem value="4">Machine 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editPart
                  ? "Update Part"
                  : "Add Part"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
