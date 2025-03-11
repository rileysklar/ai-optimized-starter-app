"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { cellsTable, valueStreamsTable, SelectCell } from "@/db/schema"

// Validation schema for cells
const cellSchema = z.object({
  name: z.string().min(1, "Cell name is required"),
  description: z.string().optional(),
  valueStreamId: z.string().uuid("Invalid value stream ID")
})

type CellInput = z.infer<typeof cellSchema>

// Create a new cell
export async function createCellAction(data: CellInput): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = cellSchema.parse(data)
    
    // Insert cell into database
    const [newCell] = await db.insert(cellsTable).values(validatedData).returning()
    
    return {
      isSuccess: true,
      message: "Cell created successfully",
      data: newCell
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid cell data"
      }
    }
    
    console.error("Error creating cell:", error)
    return {
      isSuccess: false,
      message: "Failed to create cell"
    }
  }
}

// Get all cells
export async function getCellsAction(): Promise<ActionState<SelectCell[]>> {
  try {
    const cells = await db
      .select()
      .from(cellsTable)
      .orderBy(cellsTable.name)
    
    return {
      isSuccess: true,
      message: "Cells retrieved successfully",
      data: cells
    }
  } catch (error) {
    console.error("Error getting cells:", error)
    return {
      isSuccess: false,
      message: "Failed to get cells"
    }
  }
}

// Get cells by value stream ID
export async function getCellsByValueStreamIdAction(valueStreamId: string): Promise<ActionState<SelectCell[]>> {
  try {
    const cells = await db
      .select()
      .from(cellsTable)
      .where(eq(cellsTable.valueStreamId, valueStreamId))
      .orderBy(cellsTable.name)
    
    return {
      isSuccess: true,
      message: "Cells retrieved successfully",
      data: cells
    }
  } catch (error) {
    console.error("Error getting cells:", error)
    return {
      isSuccess: false,
      message: "Failed to get cells"
    }
  }
}

// Get a cell by ID
export async function getCellByIdAction(cellId: string): Promise<ActionState<any>> {
  try {
    const cell = await db.query.cells.findFirst({
      where: eq(cellsTable.id, cellId),
      with: {
        valueStream: {
          with: {
            site: {
              with: {
                company: true
              }
            }
          }
        }
      }
    })
    
    if (!cell) {
      return {
        isSuccess: false,
        message: "Cell not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Cell retrieved successfully",
      data: cell
    }
  } catch (error) {
    console.error("Error getting cell:", error)
    return {
      isSuccess: false,
      message: "Failed to get cell"
    }
  }
}

// Update a cell
export async function updateCellAction(cellId: string, data: Partial<CellInput>): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = cellSchema.partial().parse(data)
    
    // Update cell in database
    const [updatedCell] = await db
      .update(cellsTable)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(cellsTable.id, cellId))
      .returning()
    
    if (!updatedCell) {
      return {
        isSuccess: false,
        message: "Cell not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Cell updated successfully",
      data: updatedCell
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid cell data"
      }
    }
    
    console.error("Error updating cell:", error)
    return {
      isSuccess: false,
      message: "Failed to update cell"
    }
  }
}

// Delete a cell
export async function deleteCellAction(cellId: string): Promise<ActionState<void>> {
  try {
    await db.delete(cellsTable).where(eq(cellsTable.id, cellId))
    
    return {
      isSuccess: true,
      message: "Cell deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting cell:", error)
    return {
      isSuccess: false,
      message: "Failed to delete cell"
    }
  }
} 