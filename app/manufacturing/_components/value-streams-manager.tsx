"use client"

import { deleteValueStreamAction } from "@/actions/db/value-streams-actions"
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
import { NewValueStreamDialog } from "./new-value-stream-dialog"
import { SelectValueStream, SelectSite } from "@/db/schema"

interface ValueStreamsManagerProps {
  userId: string
  initialValueStreams: SelectValueStream[]
  sites: SelectSite[]
}

export function ValueStreamsManager({
  userId,
  initialValueStreams,
  sites
}: ValueStreamsManagerProps) {
  // State
  const [valueStreams, setValueStreams] =
    useState<SelectValueStream[]>(initialValueStreams)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [valueStreamToEdit, setValueStreamToEdit] = useState<
    SelectValueStream | undefined
  >(undefined)
  const [valueStreamToDelete, setValueStreamToDelete] = useState<
    SelectValueStream | undefined
  >(undefined)
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle adding a new value stream
  const handleAddValueStream = () => {
    setValueStreamToEdit(undefined)
    setIsDialogOpen(true)
  }

  // Handle editing a value stream
  const handleEditValueStream = (valueStream: SelectValueStream) => {
    setValueStreamToEdit(valueStream)
    setIsDialogOpen(true)
  }

  // Handle deleting a value stream
  const handleConfirmDelete = async () => {
    if (!valueStreamToDelete) return

    setIsDeleting(true)

    try {
      const result = await deleteValueStreamAction(valueStreamToDelete.id)

      if (result.isSuccess) {
        toast.success("Value stream deleted successfully")
        setValueStreams(
          valueStreams.filter(vs => vs.id !== valueStreamToDelete.id)
        )
        setValueStreamToDelete(undefined)
      } else {
        toast.error(result.message || "Failed to delete value stream")
      }
    } catch (error) {
      console.error("Error deleting value stream:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Get site name by ID
  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId)
    return site ? site.name : "Unknown Site"
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Value Streams</CardTitle>
            <CardDescription>
              Manage all value streams and their assignments to sites
            </CardDescription>
          </div>
          <Button
            onClick={handleAddValueStream}
            className="flex items-center gap-2"
          >
            <PlusCircle className="size-4" />
            Add New Value Stream
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Value Stream Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Site</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {valueStreams.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground py-6 text-center"
                  >
                    No value streams defined yet. Click "Add New Value Stream"
                    to get started.
                  </TableCell>
                </TableRow>
              ) : (
                valueStreams.map(valueStream => (
                  <TableRow key={valueStream.id}>
                    <TableCell className="font-medium">
                      {valueStream.name}
                    </TableCell>
                    <TableCell>
                      {valueStream.description || "No description"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getSiteName(valueStream.siteId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditValueStream(valueStream)}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setValueStreamToDelete(valueStream)
                              }
                            >
                              <Trash className="text-destructive size-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Value Stream
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the value stream
                                "{valueStream.name}"? This action cannot be
                                undone and will remove all associated data
                                including cells.
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

      <NewValueStreamDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editValueStream={valueStreamToEdit}
        sites={sites}
        onValueStreamAdded={(newValueStream: SelectValueStream) => {
          if (valueStreamToEdit) {
            // Update existing value stream
            setValueStreams(
              valueStreams.map(vs =>
                vs.id === newValueStream.id ? newValueStream : vs
              )
            )
          } else {
            // Add new value stream
            setValueStreams([...valueStreams, newValueStream])
          }
        }}
      />
    </>
  )
}
