"use client"

import { createCellAction, updateCellAction } from "@/actions/db/cells-actions"
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
import { SelectCell, SelectValueStream } from "@/db/schema"
import { useState } from "react"
import { toast } from "sonner"

interface NewCellDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCellAdded: (cell: SelectCell) => void
  editCell?: SelectCell
  valueStreams: SelectValueStream[]
}

export function NewCellDialog({
  open,
  onOpenChange,
  onCellAdded,
  editCell,
  valueStreams
}: NewCellDialogProps) {
  // Form state
  const [name, setName] = useState(editCell?.name || "")
  const [description, setDescription] = useState(editCell?.description || "")
  const [valueStreamId, setValueStreamId] = useState(
    editCell?.valueStreamId || ""
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

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

      const result = editCell
        ? await updateCellAction(editCell.id, cellData)
        : await createCellAction(cellData)

      if (result.isSuccess) {
        toast.success(
          editCell ? "Cell updated successfully" : "New cell added successfully"
        )
        onCellAdded(result.data)
        resetForm()
        onOpenChange(false)
      } else {
        toast.error(result.message || "Failed to save cell")
      }
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
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
