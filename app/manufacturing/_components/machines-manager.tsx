"use client"

import { deleteMachineAction } from "@/actions/db/machines-actions"
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
import { NewMachineDialog } from "./new-machine-dialog"
import { SelectMachine, SelectCell } from "@/db/schema"

interface MachinesManagerProps {
  userId: string
  initialMachines: SelectMachine[]
  cells: SelectCell[]
}

export function MachinesManager({
  userId,
  initialMachines,
  cells
}: MachinesManagerProps) {
  // State
  const [machines, setMachines] = useState<SelectMachine[]>(initialMachines)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [machineToEdit, setMachineToEdit] = useState<SelectMachine | undefined>(
    undefined
  )
  const [machineToDelete, setMachineToDelete] = useState<
    SelectMachine | undefined
  >(undefined)
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle adding a new machine
  const handleAddMachine = () => {
    setMachineToEdit(undefined)
    setIsDialogOpen(true)
  }

  // Handle editing a machine
  const handleEditMachine = (machine: SelectMachine) => {
    setMachineToEdit(machine)
    setIsDialogOpen(true)
  }

  // Handle deleting a machine
  const handleConfirmDelete = async () => {
    if (!machineToDelete) return

    setIsDeleting(true)

    try {
      const result = await deleteMachineAction(machineToDelete.id)

      if (result.isSuccess) {
        toast.success("Machine deleted successfully")
        setMachines(machines.filter(m => m.id !== machineToDelete.id))
        setMachineToDelete(undefined)
      } else {
        toast.error(result.message || "Failed to delete machine")
      }
    } catch (error) {
      console.error("Error deleting machine:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Get cell name by ID
  const getCellName = (cellId: string) => {
    const cell = cells.find(c => c.id === cellId)
    return cell ? cell.name : "Unknown Cell"
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Production Machines</CardTitle>
            <CardDescription>
              Manage all production machines and their cell assignments
            </CardDescription>
          </div>
          <Button
            onClick={handleAddMachine}
            className="flex items-center gap-2"
          >
            <PlusCircle className="size-4" />
            Add New Machine
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Machine Type</TableHead>
                <TableHead>Cell</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machines.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-6 text-center"
                  >
                    No machines defined yet. Click "Add New Machine" to get
                    started.
                  </TableCell>
                </TableRow>
              ) : (
                machines.map(machine => (
                  <TableRow key={machine.id}>
                    <TableCell className="font-medium">
                      {machine.name}
                    </TableCell>
                    <TableCell>
                      {machine.description || "No description"}
                    </TableCell>
                    <TableCell>
                      {machine.machineType || "Not specified"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCellName(machine.cellId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMachine(machine)}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMachineToDelete(machine)}
                            >
                              <Trash className="text-destructive size-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Machine
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the machine "
                                {machine.name}"? This action cannot be undone
                                and will remove all associated production data.
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

      <NewMachineDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editMachine={machineToEdit}
        cells={cells}
        onMachineAdded={(newMachine: SelectMachine) => {
          if (machineToEdit) {
            // Update existing machine
            setMachines(
              machines.map(m => (m.id === newMachine.id ? newMachine : m))
            )
          } else {
            // Add new machine
            setMachines([...machines, newMachine])
          }
        }}
      />
    </>
  )
}
