"use client"

import { deleteCellAction } from "@/actions/db/cells-actions"
import { getMachinesAction } from "@/actions/db/machines-actions"
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
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { NewCellDialog } from "./new-cell-dialog"
import { SelectCell, SelectValueStream, SelectMachine } from "@/db/schema"

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
  const [machines, setMachines] = useState<SelectMachine[]>([])
  const [isLoadingMachines, setIsLoadingMachines] = useState(false)

  // Fetch machines on component mount
  useEffect(() => {
    fetchMachines()
  }, [])

  // Fetch machines function
  const fetchMachines = async () => {
    setIsLoadingMachines(true)
    try {
      const result = await getMachinesAction()
      if (result.isSuccess) {
        setMachines(result.data)
      } else {
        toast.error("Failed to fetch machines")
      }
    } catch (error) {
      console.error("Error fetching machines:", error)
      toast.error("Something went wrong when fetching machines")
    } finally {
      setIsLoadingMachines(false)
    }
  }

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
        fetchMachines() // Refresh machines after deletion
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
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cells Management</CardTitle>
            <CardDescription>
              Create and manage cells in your manufacturing facility
            </CardDescription>
          </div>
          <Button onClick={handleAddCell} className="flex items-center gap-1">
            <PlusCircle className="size-4" />
            <span>Add New Cell</span>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cell Name</TableHead>
                <TableHead>Value Stream</TableHead>
                <TableHead>Machines</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cells.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
                      <Badge variant="outline">
                        {getValueStreamName(cell.valueStreamId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isLoadingMachines ? (
                        <span className="text-muted-foreground text-sm">
                          Loading...
                        </span>
                      ) : (
                        <span>
                          {machines.filter(m => m.cellId === cell.id).length}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {cell.description || "No description"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCell(cell)}
                          className="size-8"
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => setCellToDelete(cell)}
                            >
                              <Trash className="size-4" />
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
        machines={machines}
        onMachinesUpdated={fetchMachines}
        onCellAdded={(newCell: SelectCell) => {
          if (cellToEdit) {
            // Update existing cell
            setCells(cells.map(c => (c.id === newCell.id ? newCell : c)))
          } else {
            // Add new cell
            setCells([...cells, newCell])
          }
          // Refresh machines to get updated assignments
          fetchMachines()
        }}
      />
    </>
  )
}
