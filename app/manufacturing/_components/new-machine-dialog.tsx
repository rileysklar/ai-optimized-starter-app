"use client"

import {
  createMachineAction,
  updateMachineAction
} from "@/actions/db/machines-actions"
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
import { SelectMachine, SelectCell } from "@/db/schema"
import { useState } from "react"
import { toast } from "sonner"

// Define the machine status type
type MachineStatus = "idle" | "running" | "down" | "maintenance"

interface NewMachineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMachineAdded: (machine: SelectMachine) => void
  editMachine?: SelectMachine
  cells: SelectCell[]
}

export function NewMachineDialog({
  open,
  onOpenChange,
  onMachineAdded,
  editMachine,
  cells
}: NewMachineDialogProps) {
  // Form state
  const [name, setName] = useState(editMachine?.name || "")
  const [description, setDescription] = useState(editMachine?.description || "")
  const [machineType, setMachineType] = useState(editMachine?.machineType || "")
  const [cellId, setCellId] = useState(editMachine?.cellId || "")
  const [status, setStatus] = useState<MachineStatus>(
    (editMachine?.status as MachineStatus) || "idle"
  )
  const [standardCycleTime, setStandardCycleTime] = useState(
    editMachine?.standardCycleTime.toString() || "0"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !cellId) {
      toast.error("Machine name and cell are required")
      return
    }

    setIsSubmitting(true)

    try {
      const machineData = {
        name,
        description,
        machineType,
        cellId,
        status,
        standardCycleTime: parseFloat(standardCycleTime)
      }

      const result = editMachine
        ? await updateMachineAction(editMachine.id, machineData)
        : await createMachineAction(machineData)

      if (result.isSuccess) {
        toast.success(
          editMachine
            ? "Machine updated successfully"
            : "New machine added successfully"
        )
        onMachineAdded(result.data)
        resetForm()
        onOpenChange(false)
      } else {
        toast.error(result.message || "Failed to save machine")
      }
    } catch (error) {
      console.error("Error saving machine:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    if (!editMachine) {
      setName("")
      setDescription("")
      setMachineType("")
      setCellId("")
      setStatus("idle")
      setStandardCycleTime("0")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editMachine ? "Edit Machine" : "Add New Machine"}
            </DialogTitle>
            <DialogDescription>
              {editMachine
                ? "Update the machine details below"
                : "Fill in the machine details to add it to the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Machine Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                placeholder="Enter machine name"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description || ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="Enter machine description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="machineType">Machine Type (Optional)</Label>
                <Input
                  id="machineType"
                  value={machineType || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMachineType(e.target.value)
                  }
                  placeholder="E.g., CNC, Assembly, Packaging"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="standardCycleTime">
                  Standard Cycle Time (seconds)
                </Label>
                <Input
                  id="standardCycleTime"
                  type="number"
                  min="0"
                  step="0.1"
                  value={standardCycleTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setStandardCycleTime(e.target.value)
                  }
                  placeholder="Enter standard cycle time"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cellId">Cell</Label>
                <Select value={cellId} onValueChange={setCellId} required>
                  <SelectTrigger id="cellId">
                    <SelectValue placeholder="Select cell" />
                  </SelectTrigger>
                  <SelectContent>
                    {cells.length === 0 ? (
                      <SelectItem value="no-cells" disabled>
                        No cells available
                      </SelectItem>
                    ) : (
                      cells.map(cell => (
                        <SelectItem key={cell.id} value={cell.id}>
                          {cell.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select
                  value={status}
                  onValueChange={(value: MachineStatus) => setStatus(value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idle">Idle</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="down">Down</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                ? editMachine
                  ? "Updating..."
                  : "Creating..."
                : editMachine
                  ? "Update Machine"
                  : "Create Machine"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
