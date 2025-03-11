"use client"

import { deleteCellAction } from "@/actions/db/cells-actions"
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
import { NewCellDialog } from "./new-cell-dialog"
import { SelectCell, SelectValueStream } from "@/db/schema"

interface CellsManagerProps {
  userId: string
  initialCells: SelectCell[]
  valueStreams: SelectValueStream[]
}

export function CellsManager({
  userId,
  initialCells,
  valueStreams
}: CellsManagerProps) {
  // State
  const [cells, setCells] = useState<SelectCell[]>(initialCells)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [cellToEdit, setCellToEdit] = useState<SelectCell | undefined>(
    undefined
  )
  const [cellToDelete, setCellToDelete] = useState<SelectCell | undefined>(
    undefined
  )
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle adding a new cell
  const handleAddCell = () => {
    setCellToEdit(undefined)
    setIsDialogOpen(true)
  }

  // Handle editing a cell
  const handleEditCell = (cell: SelectCell) => {
    setCellToEdit(cell)
    setIsDialogOpen(true)
  }

  // Handle deleting a cell
  const handleConfirmDelete = async () => {
    if (!cellToDelete) return

    setIsDeleting(true)

    try {
      const result = await deleteCellAction(cellToDelete.id)

      if (result.isSuccess) {
        toast.success("Cell deleted successfully")
        setCells(cells.filter(c => c.id !== cellToDelete.id))
        setCellToDelete(undefined)
      } else {
        toast.error(result.message || "Failed to delete cell")
      }
    } catch (error) {
      console.error("Error deleting cell:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Get value stream name by ID
  const getValueStreamName = (valueStreamId: string) => {
    const valueStream = valueStreams.find(vs => vs.id === valueStreamId)
    return valueStream ? valueStream.name : "Unknown Value Stream"
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Production Cells</CardTitle>
            <CardDescription>
              Manage all production cells and their assignments to value streams
            </CardDescription>
          </div>
          <Button onClick={handleAddCell} className="flex items-center gap-2">
            <PlusCircle className="size-4" />
            Add New Cell
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cell Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Value Stream</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cells.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground py-6 text-center"
                  >
                    No cells defined yet. Click "Add New Cell" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                cells.map(cell => (
                  <TableRow key={cell.id}>
                    <TableCell className="font-medium">{cell.name}</TableCell>
                    <TableCell>
                      {cell.description || "No description"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getValueStreamName(cell.valueStreamId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCell(cell)}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCellToDelete(cell)}
                            >
                              <Trash className="text-destructive size-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Cell</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the cell "
                                {cell.name}"? This action cannot be undone and
                                will remove all associated data.
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

      <NewCellDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editCell={cellToEdit}
        valueStreams={valueStreams}
        onCellAdded={(newCell: SelectCell) => {
          if (cellToEdit) {
            // Update existing cell
            setCells(cells.map(c => (c.id === newCell.id ? newCell : c)))
          } else {
            // Add new cell
            setCells([...cells, newCell])
          }
        }}
      />
    </>
  )
}
