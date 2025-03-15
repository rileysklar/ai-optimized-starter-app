"use client"

import { createCellAction, updateCellAction } from "@/actions/db/cells-actions"
import { updateMachinesCellAction } from "@/actions/db/machines-actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { SelectCell, SelectValueStream, SelectMachine } from "@/db/schema"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface NewCellDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCellAdded: (cell: SelectCell) => void
  editCell?: SelectCell
  valueStreams: SelectValueStream[]
  machines: SelectMachine[]
  onMachinesUpdated?: () => void
}

export function NewCellDialog({
  open,
  onOpenChange,
  onCellAdded,
  editCell,
  valueStreams,
  machines,
  onMachinesUpdated
}: NewCellDialogProps) {
  // Form state
  const [name, setName] = useState(editCell?.name || "")
  const [description, setDescription] = useState(editCell?.description || "")
  const [valueStreamId, setValueStreamId] = useState(
    editCell?.valueStreamId || ""
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([])

  // Set currently assigned machines when editing
  useEffect(() => {
    if (editCell) {
      const machinesInCell = machines.filter(
        machine => machine.cellId === editCell.id
      )
      setSelectedMachineIds(machinesInCell.map(machine => machine.id))
    } else {
      setSelectedMachineIds([])
    }
  }, [editCell, machines])

  // Toggle machine selection
  const toggleMachineSelection = (machineId: string) => {
    setSelectedMachineIds(prev =>
      prev.includes(machineId)
        ? prev.filter(id => id !== machineId)
        : [...prev, machineId]
    )
  }

  // Check if a machine is already assigned to a different cell
  const isMachineAssignedToOtherCell = (machine: SelectMachine) => {
    return editCell
      ? machine.cellId && machine.cellId !== editCell.id
      : !!machine.cellId
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !valueStreamId) {
      toast.error("Cell name and value stream are required")
      return
    }

    setIsSubmitting(true)

    try {
      const cellData = {
        name,
        description,
        valueStreamId
      }

      // Create or update the cell
      const result = editCell
        ? await updateCellAction(editCell.id, cellData)
        : await createCellAction(cellData)

      if (!result.isSuccess) {
        toast.error(result.message || "Failed to save cell")
        setIsSubmitting(false)
        return
      }

      // Assign machines to the cell if any are selected
      if (selectedMachineIds.length > 0) {
        const cellId = result.data.id
        const machineResult = await updateMachinesCellAction(
          selectedMachineIds,
          cellId
        )

        if (!machineResult.isSuccess) {
          toast.error(
            `Cell saved but failed to assign machines: ${machineResult.message}`
          )
        } else {
          toast.success(
            `${machineResult.data.length} machines assigned to the cell`
          )
          if (onMachinesUpdated) {
            onMachinesUpdated()
          }
        }
      }

      toast.success(
        editCell ? "Cell updated successfully" : "New cell added successfully"
      )
      onCellAdded(result.data)
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving cell:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    if (!editCell) {
      setName("")
      setDescription("")
      setValueStreamId("")
      setSelectedMachineIds([])
    }
  }

  // Filter available machines
  const availableMachines = editCell
    ? machines
    : machines.filter(machine => !machine.cellId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editCell ? "Edit Cell" : "Add New Cell"}</DialogTitle>
            <DialogDescription>
              {editCell
                ? "Update the cell details below"
                : "Fill in the cell details to add it to the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Cell Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                placeholder="Enter cell name"
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
                placeholder="Enter cell description"
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="valueStreamId">Value Stream</Label>
              <Select
                value={valueStreamId}
                onValueChange={setValueStreamId}
                required
              >
                <SelectTrigger id="valueStreamId">
                  <SelectValue placeholder="Select value stream" />
                </SelectTrigger>
                <SelectContent>
                  {valueStreams.length === 0 ? (
                    <SelectItem value="no-value-streams" disabled>
                      No value streams available
                    </SelectItem>
                  ) : (
                    valueStreams.map(valueStream => (
                      <SelectItem key={valueStream.id} value={valueStream.id}>
                        {valueStream.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Select Machines to Add to Cell</Label>
              <div className="max-h-[200px] overflow-y-auto rounded-md border p-3">
                {availableMachines.length === 0 ? (
                  <p className="text-muted-foreground py-2 text-sm">
                    No available machines found
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {availableMachines.map(machine => {
                      const isAssignedToOther =
                        isMachineAssignedToOtherCell(machine)

                      return (
                        <div
                          key={machine.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`machine-${machine.id}`}
                            checked={selectedMachineIds.includes(machine.id)}
                            onCheckedChange={_ =>
                              toggleMachineSelection(machine.id)
                            }
                            disabled={!!isAssignedToOther}
                          />
                          <label
                            htmlFor={`machine-${machine.id}`}
                            className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                              isAssignedToOther ? "text-muted-foreground" : ""
                            }`}
                          >
                            {machine.name}
                            {isAssignedToOther && " (assigned to another cell)"}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {editCell
                  ? "You can reassign machines to this cell"
                  : "Only unassigned machines are shown"}
              </p>
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
                ? editCell
                  ? "Updating..."
                  : "Creating..."
                : editCell
                  ? "Update Cell"
                  : "Create Cell"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
