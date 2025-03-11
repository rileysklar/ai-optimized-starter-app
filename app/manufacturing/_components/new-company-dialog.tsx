"use client"

import {
  createCompanyAction,
  updateCompanyAction
} from "@/actions/db/companies-actions"
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
import { Textarea } from "@/components/ui/textarea"
import { SelectCompany } from "@/db/schema"
import { useState } from "react"
import { toast } from "sonner"

interface NewCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompanyAdded: (company: SelectCompany) => void
  editCompany?: SelectCompany
}

export function NewCompanyDialog({
  open,
  onOpenChange,
  onCompanyAdded,
  editCompany
}: NewCompanyDialogProps) {
  // Form state
  const [name, setName] = useState(editCompany?.name || "")
  const [description, setDescription] = useState(editCompany?.description || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast.error("Company name is required")
      return
    }

    setIsSubmitting(true)

    try {
      const companyData = {
        name,
        description
      }

      const result = editCompany
        ? await updateCompanyAction(editCompany.id, companyData)
        : await createCompanyAction(companyData)

      if (result.isSuccess) {
        toast.success(
          editCompany
            ? "Company updated successfully"
            : "New company added successfully"
        )
        onCompanyAdded(result.data)
        resetForm()
        onOpenChange(false)
      } else {
        toast.error(result.message || "Failed to save company")
      }
    } catch (error) {
      console.error("Error saving company:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    if (!editCompany) {
      setName("")
      setDescription("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editCompany ? "Edit Company" : "Add New Company"}
            </DialogTitle>
            <DialogDescription>
              {editCompany
                ? "Update the company details below"
                : "Fill in the company details to add it to the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="Enter company description"
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
                ? editCompany
                  ? "Updating..."
                  : "Creating..."
                : editCompany
                  ? "Update Company"
                  : "Create Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
