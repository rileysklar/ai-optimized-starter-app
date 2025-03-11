"use client"

import { deleteSiteAction } from "@/actions/db/sites-actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Pencil, Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { NewSiteDialog } from "./new-site-dialog"
import { SelectSite, SelectCompany } from "@/db/schema"

interface SitesManagerProps {
  userId: string
  initialSites: SelectSite[]
  companies: SelectCompany[]
}

export function SitesManager({
  userId,
  initialSites,
  companies
}: SitesManagerProps) {
  // State
  const [sites, setSites] = useState<SelectSite[]>(initialSites)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [siteToEdit, setSiteToEdit] = useState<SelectSite | undefined>(
    undefined
  )
  const [siteToDelete, setSiteToDelete] = useState<SelectSite | undefined>(
    undefined
  )
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle adding a new site
  const handleAddSite = () => {
    setSiteToEdit(undefined)
    setIsDialogOpen(true)
  }

  // Handle editing a site
  const handleEditSite = (site: SelectSite) => {
    setSiteToEdit(site)
    setIsDialogOpen(true)
  }

  // Handle deleting a site
  const handleConfirmDelete = async () => {
    if (!siteToDelete) return

    setIsDeleting(true)

    try {
      const result = await deleteSiteAction(siteToDelete.id)

      if (result.isSuccess) {
        toast.success("Site deleted successfully")
        setSites(sites.filter(s => s.id !== siteToDelete.id))
        setSiteToDelete(undefined)
      } else {
        toast.error(result.message || "Failed to delete site")
      }
    } catch (error) {
      console.error("Error deleting site:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Get company name by ID
  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company ? company.name : "Unknown Company"
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Manufacturing Sites</CardTitle>
            <CardDescription>
              Manage all manufacturing sites and their company assignments
            </CardDescription>
          </div>
          <Button onClick={handleAddSite} className="flex items-center gap-2">
            <PlusCircle className="size-4" />
            Add New Site
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground py-6 text-center"
                  >
                    No sites defined yet. Click "Add New Site" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                sites.map(site => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">{site.name}</TableCell>
                    <TableCell>
                      {site.location || "No location specified"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCompanyName(site.companyId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSite(site)}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSiteToDelete(site)}
                            >
                              <Trash className="text-destructive size-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Site</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the site "
                                {site.name}"? This action cannot be undone and
                                will remove all associated value streams, cells,
                                and production data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleConfirmDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NewSiteDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editSite={siteToEdit}
        companies={companies}
        onSiteAdded={(newSite: SelectSite) => {
          if (siteToEdit) {
            // Update existing site
            setSites(sites.map(s => (s.id === newSite.id ? newSite : s)))
          } else {
            // Add new site
            setSites([...sites, newSite])
          }
        }}
      />
    </>
  )
}
