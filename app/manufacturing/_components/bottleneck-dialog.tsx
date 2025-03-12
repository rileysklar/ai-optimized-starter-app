"use client"

import {
  createBottleneckAnalysisAction,
  updateBottleneckAnalysisAction
} from "@/actions/db/bottleneck-analysis-actions"
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
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "../../../components/ui/date-picker"
import {
  SelectMachine,
  SelectCell,
  SelectBottleneckAnalysis
} from "@/db/schema"
import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"

// Severity levels for bottlenecks
const SEVERITY_LEVELS = [
  { value: "10", label: "Low (10%)" },
  { value: "25", label: "Medium (25%)" },
  { value: "50", label: "High (50%)" },
  { value: "75", label: "Critical (75%)" },
  { value: "90", label: "Severe (90%)" }
]

interface BottleneckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBottleneckAdded: (bottleneck: SelectBottleneckAnalysis) => void
  editBottleneck?: SelectBottleneckAnalysis
  machines: SelectMachine[]
  cellId: string
}

export function BottleneckDialog({
  open,
  onOpenChange,
  onBottleneckAdded,
  editBottleneck,
  machines,
  cellId
}: BottleneckDialogProps) {
  // Form state
  const [date, setDate] = useState<Date | undefined>(
    editBottleneck?.date ? new Date(editBottleneck.date) : new Date()
  )
  const [bottleneckMachineId, setBottleneckMachineId] = useState(
    editBottleneck?.bottleneckMachineId || ""
  )
  const [bottleneckSeverity, setBottleneckSeverity] = useState(
    editBottleneck?.bottleneckSeverity?.toString() || "25"
  )
  const [notes, setNotes] = useState(editBottleneck?.notes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date || !cellId) {
      toast.error("Date and cell are required")
      return
    }

    setIsSubmitting(true)

    try {
      const bottleneckData = {
        date: format(date, "yyyy-MM-dd"),
        cellId,
        bottleneckMachineId: bottleneckMachineId || null,
        bottleneckSeverity: bottleneckSeverity,
        notes: notes || null
      }

      const result = editBottleneck
        ? await updateBottleneckAnalysisAction(
            editBottleneck.id,
            bottleneckData
          )
        : await createBottleneckAnalysisAction(bottleneckData)

      if (result.isSuccess) {
        toast.success(
          editBottleneck
            ? "Bottleneck analysis updated successfully"
            : "New bottleneck analysis added successfully"
        )
        onBottleneckAdded(result.data)
        resetForm()
        onOpenChange(false)
      } else {
        toast.error(result.message || "Failed to save bottleneck analysis")
      }
    } catch (error) {
      console.error("Error saving bottleneck analysis:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    if (!editBottleneck) {
      setDate(new Date())
      setBottleneckMachineId("")
      setBottleneckSeverity("25")
      setNotes("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editBottleneck
                ? "Edit Bottleneck Analysis"
                : "Add Bottleneck Analysis"}
            </DialogTitle>
            <DialogDescription>
              {editBottleneck
                ? "Update the bottleneck analysis details below"
                : "Record a production bottleneck to track and address efficiency issues"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Date</Label>
                <DatePicker date={date} setDate={setDate} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="bottleneckSeverity">Bottleneck Severity</Label>
                <Select
                  value={bottleneckSeverity}
                  onValueChange={setBottleneckSeverity}
                >
                  <SelectTrigger id="bottleneckSeverity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bottleneckMachineId">Bottleneck Machine</Label>
              <Select
                value={bottleneckMachineId}
                onValueChange={setBottleneckMachineId}
              >
                <SelectTrigger id="bottleneckMachineId">
                  <SelectValue placeholder="Select machine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.length === 0 ? (
                    <SelectItem value="no-machines" disabled>
                      No machines available
                    </SelectItem>
                  ) : (
                    machines.map(machine => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-sm">
                Select the machine that is causing the bottleneck in production
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Analysis Notes</Label>
              <Textarea
                id="notes"
                value={notes || ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNotes(e.target.value)
                }
                placeholder="Enter analysis notes and recommended actions"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? editBottleneck
                  ? "Updating..."
                  : "Creating..."
                : editBottleneck
                  ? "Update Analysis"
                  : "Create Analysis"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
