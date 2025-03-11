"use client"

import {
  createValueStreamAction,
  updateValueStreamAction
} from "@/actions/db/value-streams-actions"
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
import { SelectValueStream, SelectSite } from "@/db/schema"
import { useState } from "react"
import { toast } from "sonner"

interface NewValueStreamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onValueStreamAdded: (valueStream: SelectValueStream) => void
  editValueStream?: SelectValueStream
  sites: SelectSite[]
}

export function NewValueStreamDialog({
  open,
  onOpenChange,
  onValueStreamAdded,
  editValueStream,
  sites
}: NewValueStreamDialogProps) {
  // Form state
  const [name, setName] = useState(editValueStream?.name || "")
  const [description, setDescription] = useState(
    editValueStream?.description || ""
  )
  const [siteId, setSiteId] = useState(editValueStream?.siteId || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !siteId) {
      toast.error("Value stream name and site are required")
      return
    }

    setIsSubmitting(true)

    try {
      const valueStreamData = {
        name,
        description,
        siteId
      }

      const result = editValueStream
        ? await updateValueStreamAction(editValueStream.id, valueStreamData)
        : await createValueStreamAction(valueStreamData)

      if (result.isSuccess) {
        toast.success(
          editValueStream
            ? "Value stream updated successfully"
            : "New value stream added successfully"
        )
        onValueStreamAdded(result.data)
        resetForm()
        onOpenChange(false)
      } else {
        toast.error(result.message || "Failed to save value stream")
      }
    } catch (error) {
      console.error("Error saving value stream:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    if (!editValueStream) {
      setName("")
      setDescription("")
      setSiteId("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editValueStream ? "Edit Value Stream" : "Add New Value Stream"}
            </DialogTitle>
            <DialogDescription>
              {editValueStream
                ? "Update the value stream details below"
                : "Fill in the value stream details to add it to the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Value Stream Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter value stream name"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter value stream description"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="siteId">Site</Label>
              <Select value={siteId} onValueChange={setSiteId} required>
                <SelectTrigger id="siteId">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.length === 0 ? (
                    <SelectItem value="no-sites" disabled>
                      No sites available
                    </SelectItem>
                  ) : (
                    sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
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
                ? editValueStream
                  ? "Updating..."
                  : "Creating..."
                : editValueStream
                  ? "Update Value Stream"
                  : "Create Value Stream"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
