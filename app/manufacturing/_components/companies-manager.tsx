"use client"

import { deleteCompanyAction } from "@/actions/db/companies-actions"
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
import { PlusCircle, Pencil, Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { NewCompanyDialog } from "./new-company-dialog"
import { SelectCompany } from "@/db/schema"

interface CompaniesManagerProps {
  userId: string
  initialCompanies: SelectCompany[]
}

export function CompaniesManager({
  userId,
  initialCompanies
}: CompaniesManagerProps) {
  // State
  const [companies, setCompanies] = useState<SelectCompany[]>(initialCompanies)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [companyToEdit, setCompanyToEdit] = useState<SelectCompany | undefined>(
    undefined
  )
  const [companyToDelete, setCompanyToDelete] = useState<
    SelectCompany | undefined
  >(undefined)
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle adding a new company
  const handleAddCompany = () => {
    setCompanyToEdit(undefined)
    setIsDialogOpen(true)
  }

  // Handle editing a company
  const handleEditCompany = (company: SelectCompany) => {
    setCompanyToEdit(company)
    setIsDialogOpen(true)
  }

  // Handle deleting a company
  const handleConfirmDelete = async () => {
    if (!companyToDelete) return

    setIsDeleting(true)

    try {
      const result = await deleteCompanyAction(companyToDelete.id)

      if (result.isSuccess) {
        toast.success("Company deleted successfully")
        setCompanies(companies.filter(c => c.id !== companyToDelete.id))
        setCompanyToDelete(undefined)
      } else {
        toast.error(result.message || "Failed to delete company")
      }
    } catch (error) {
      console.error("Error deleting company:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Manufacturing Companies</CardTitle>
            <CardDescription>
              Manage all manufacturing companies
            </CardDescription>
          </div>
          <Button
            onClick={handleAddCompany}
            className="flex items-center gap-2"
          >
            <PlusCircle className="size-4" />
            Add New Company
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-muted-foreground py-6 text-center"
                  >
                    No companies defined yet. Click "Add New Company" to get
                    started.
                  </TableCell>
                </TableRow>
              ) : (
                companies.map(company => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      {company.name}
                    </TableCell>
                    <TableCell>
                      {company.description || "No description"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCompany(company)}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCompanyToDelete(company)}
                            >
                              <Trash className="text-destructive size-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Company
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the company "
                                {company.name}"? This action cannot be undone
                                and will remove all associated sites, value
                                streams, cells, and production data.
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

      <NewCompanyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editCompany={companyToEdit}
        onCompanyAdded={(newCompany: SelectCompany) => {
          if (companyToEdit) {
            // Update existing company
            setCompanies(
              companies.map(c => (c.id === newCompany.id ? newCompany : c))
            )
          } else {
            // Add new company
            setCompanies([...companies, newCompany])
          }
        }}
      />
    </>
  )
}
