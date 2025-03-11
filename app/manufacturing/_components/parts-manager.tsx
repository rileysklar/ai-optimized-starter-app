"use client"

import { deletePartAction } from "@/actions/db/parts-actions"
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
import { NewPartDialog } from "./new-part-dialog"

interface Part {
  id: string
  partNumber: string
  description: string
  cycleTimeMachine1: number
  cycleTimeMachine2: number
  cycleTimeMachine3: number
  cycleTimeMachine4: number
  bottleneckMachine: number
}

interface PartsManagerProps {
  userId: string
  initialParts: Part[]
}

export function PartsManager({ userId, initialParts }: PartsManagerProps) {
  // State
  const [parts, setParts] = useState<Part[]>(initialParts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [partToEdit, setPartToEdit] = useState<Part | undefined>(undefined)
  const [partToDelete, setPartToDelete] = useState<Part | undefined>(undefined)
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle adding a new part
  const handleAddPart = () => {
    setPartToEdit(undefined)
    setIsDialogOpen(true)
  }

  // Handle editing a part
  const handleEditPart = (part: Part) => {
    setPartToEdit(part)
    setIsDialogOpen(true)
  }

  // Handle deleting a part
  const handleConfirmDelete = async () => {
    if (!partToDelete) return

    setIsDeleting(true)

    try {
      const result = await deletePartAction(partToDelete.id)

      if (result.isSuccess) {
        toast.success("Part deleted successfully")
        setParts(parts.filter(p => p.id !== partToDelete.id))
        setPartToDelete(undefined)
      } else {
        toast.error(result.message || "Failed to delete part")
      }
    } catch (error) {
      console.error("Error deleting part:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Format cycle time display
  const formatTime = (minutes: number) => {
    return `${minutes} min`
  }

  // Determine bottleneck machine label
  const getBottleneckLabel = (machine: number) => {
    switch (machine) {
      case 1:
        return "Machine 1 (T1)"
      case 2:
        return "Machine 2 (T2)"
      case 3:
        return "Machine 3 (G)"
      case 4:
        return "Machine 4 (M)"
      default:
        return "Unknown"
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Parts Library</CardTitle>
            <CardDescription>
              Manage all part definitions and their standard cycle times
            </CardDescription>
          </div>
          <Button onClick={handleAddPart} className="flex items-center gap-2">
            <PlusCircle className="size-4" />
            Add New Part
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Number</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">T1 Time</TableHead>
                <TableHead className="text-center">T2 Time</TableHead>
                <TableHead className="text-center">G Time</TableHead>
                <TableHead className="text-center">M Time</TableHead>
                <TableHead className="text-center">Bottleneck</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground py-6 text-center"
                  >
                    No parts defined yet. Click "Add New Part" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                parts.map(part => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">
                      {part.partNumber}
                    </TableCell>
                    <TableCell>{part.description}</TableCell>
                    <TableCell className="text-center">
                      {formatTime(part.cycleTimeMachine1)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatTime(part.cycleTimeMachine2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatTime(part.cycleTimeMachine3)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatTime(part.cycleTimeMachine4)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {getBottleneckLabel(part.bottleneckMachine)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPart(part)}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPartToDelete(part)}
                            >
                              <Trash className="text-destructive size-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Part</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the part "
                                {part.partNumber}"? This action cannot be
                                undone.
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

      <NewPartDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editPart={partToEdit}
        onPartAdded={newPart => {
          if (partToEdit) {
            // Update existing part
            setParts(parts.map(p => (p.id === newPart.id ? newPart : p)))
          } else {
            // Add new part
            setParts([...parts, newPart])
          }
        }}
      />
    </>
  )
}
