"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { InsertPart, SelectPart, partsTable } from "@/db/schema"

// Validation schema for parts
const partSchema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  description: z.string().min(1, "Description is required"),
  cycleTimeMachine1: z.coerce.number().min(0, "Cycle time must be 0 or greater"),
  cycleTimeMachine2: z.coerce.number().min(0, "Cycle time must be 0 or greater"),
  cycleTimeMachine3: z.coerce.number().min(0, "Cycle time must be 0 or greater"),
  cycleTimeMachine4: z.coerce.number().min(0, "Cycle time must be 0 or greater"),
  bottleneckMachine: z.coerce.number().min(1).max(4, "Bottleneck machine must be between 1 and 4")
})

type PartInput = z.infer<typeof partSchema>

// Create a new part
export async function createPartAction(data: PartInput): Promise<ActionState<SelectPart>> {
  try {
    // Validate input
    const validatedData = partSchema.parse(data)
    
    // Insert part into database
    const [newPart] = await db.insert(partsTable).values(validatedData).returning()
    
    return {
      isSuccess: true,
      message: "Part created successfully",
      data: newPart
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid part data"
      }
    }
    
    console.error("Error creating part:", error)
    return {
      isSuccess: false,
      message: "Failed to create part"
    }
  }
}

// Get all parts
export async function getPartsAction(): Promise<ActionState<SelectPart[]>> {
  try {
    // Direct query since we don't have a query builder for parts yet
    const parts = await db
      .select()
      .from(partsTable)
      .orderBy(partsTable.partNumber)
    
    return {
      isSuccess: true,
      message: "Parts retrieved successfully",
      data: parts
    }
  } catch (error) {
    console.error("Error getting parts:", error)
    return {
      isSuccess: false,
      message: "Failed to get parts"
    }
  }
}

// Get a part by ID
export async function getPartByIdAction(partId: string): Promise<ActionState<SelectPart>> {
  try {
    const [part] = await db
      .select()
      .from(partsTable)
      .where(eq(partsTable.id, partId))
      .limit(1)
    
    if (!part) {
      return {
        isSuccess: false,
        message: "Part not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Part retrieved successfully",
      data: part
    }
  } catch (error) {
    console.error("Error getting part:", error)
    return {
      isSuccess: false,
      message: "Failed to get part"
    }
  }
}

// Update a part
export async function updatePartAction(partId: string, data: Partial<PartInput>): Promise<ActionState<SelectPart>> {
  try {
    // Validate input
    const validatedData = partSchema.partial().parse(data)
    
    // Update part in database
    const [updatedPart] = await db
      .update(partsTable)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(partsTable.id, partId))
      .returning()
    
    if (!updatedPart) {
      return {
        isSuccess: false,
        message: "Part not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Part updated successfully",
      data: updatedPart
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid part data"
      }
    }
    
    console.error("Error updating part:", error)
    return {
      isSuccess: false,
      message: "Failed to update part"
    }
  }
}

// Delete a part
export async function deletePartAction(partId: string): Promise<ActionState<void>> {
  try {
    await db.delete(partsTable).where(eq(partsTable.id, partId))
    
    return {
      isSuccess: true,
      message: "Part deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting part:", error)
    return {
      isSuccess: false,
      message: "Failed to delete part"
    }
  }
} 