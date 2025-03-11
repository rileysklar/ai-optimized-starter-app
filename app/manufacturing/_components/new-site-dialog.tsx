"use client"

import { createSiteAction, updateSiteAction } from "@/actions/db/sites-actions"
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
import { SelectSite, SelectCompany } from "@/db/schema"
import { useState } from "react"
import { toast } from "sonner"

interface NewSiteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSiteAdded: (site: SelectSite) => void
  editSite?: SelectSite
  companies: SelectCompany[]
}

export function NewSiteDialog({
  open,
  onOpenChange,
  onSiteAdded,
  editSite,
  companies
}: NewSiteDialogProps) {
  // Form state
  const [name, setName] = useState(editSite?.name || "")
  const [location, setLocation] = useState(editSite?.location || "")
  const [companyId, setCompanyId] = useState(editSite?.companyId || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !companyId) {
      toast.error("Site name and company are required")
      return
    }

    setIsSubmitting(true)

    try {
      const siteData = {
        name,
        location,
        companyId
      }

      const result = editSite
        ? await updateSiteAction(editSite.id, siteData)
        : await createSiteAction(siteData)

      if (result.isSuccess) {
        toast.success(
          editSite ? "Site updated successfully" : "New site added successfully"
        )
        onSiteAdded(result.data)
        resetForm()
        onOpenChange(false)
      } else {
        toast.error(result.message || "Failed to save site")
      }
    } catch (error) {
      console.error("Error saving site:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    if (!editSite) {
      setName("")
      setLocation("")
      setCompanyId("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editSite ? "Edit Site" : "Add New Site"}</DialogTitle>
            <DialogDescription>
              {editSite
                ? "Update the site details below"
                : "Fill in the site details to add it to the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Site Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter site name"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Enter site location"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="companyId">Company</Label>
              <Select value={companyId} onValueChange={setCompanyId} required>
                <SelectTrigger id="companyId">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.length === 0 ? (
                    <SelectItem value="no-companies" disabled>
                      No companies available
                    </SelectItem>
                  ) : (
                    companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
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
                ? editSite
                  ? "Updating..."
                  : "Creating..."
                : editSite
                  ? "Update Site"
                  : "Create Site"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
