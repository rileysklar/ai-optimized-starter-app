"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { setupTimesTable } from "@/db/schema"

// Validation schema for setup times
const setupTimesSchema = z.object({
  cellId: z.string().uuid("Invalid cell ID"),
  setupTimeMachine1: z.coerce.number().min(0, "Setup time must be 0 or greater"),
  setupTimeMachine2: z.coerce.number().min(0, "Setup time must be 0 or greater"),
  setupTimeMachine3: z.coerce.number().min(0, "Setup time must be 0 or greater"),
  setupTimeMachine4: z.coerce.number().min(0, "Setup time must be 0 or greater"),
  date: z.string().optional()
})

type SetupTimesInput = z.infer<typeof setupTimesSchema>

// Create new setup times
export async function createSetupTimesAction(data: SetupTimesInput): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = setupTimesSchema.parse(data)
    
    // This is a simplified mock implementation
    console.log("Creating setup times:", validatedData)
    
    return {
      isSuccess: true,
      message: "Setup times created successfully",
      data: {
        id: `setup-${Date.now()}`,
        ...validatedData,
        date: validatedData.date || new Date().toISOString().split('T')[0]
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid setup times data"
      }
    }
    
    console.error("Error creating setup times:", error)
    return {
      isSuccess: false,
      message: "Failed to create setup times"
    }
  }
}

// Get all setup times
export async function getSetupTimesAction(): Promise<ActionState<any[]>> {
  try {
    // This is a simplified mock implementation
    console.log("Getting all setup times")
    
    return {
      isSuccess: true,
      message: "Setup times retrieved successfully",
      data: [
        {
          id: "setup-1",
          cellId: "cell-1",
          cellName: "Cell A",
          setupTimeMachine1: 10,
          setupTimeMachine2: 15,
          setupTimeMachine3: 5,
          setupTimeMachine4: 8,
          date: "2023-10-01"
        },
        {
          id: "setup-2",
          cellId: "cell-2",
          cellName: "Cell B",
          setupTimeMachine1: 12,
          setupTimeMachine2: 8,
          setupTimeMachine3: 10,
          setupTimeMachine4: 15,
          date: "2023-10-02"
        }
      ]
    }
  } catch (error) {
    console.error("Error getting setup times:", error)
    return {
      isSuccess: false,
      message: "Failed to get setup times"
    }
  }
}

// Get setup times for a specific cell
export async function getSetupTimesByCellAction(cellId: string): Promise<ActionState<any>> {
  try {
    // This is a simplified mock implementation
    console.log("Getting setup times for cell:", cellId)
    
    return {
      isSuccess: true,
      message: "Setup times retrieved successfully",
      data: {
        id: "setup-1",
        cellId,
        setupTimeMachine1: 10,
        setupTimeMachine2: 15,
        setupTimeMachine3: 5,
        setupTimeMachine4: 8,
        date: "2023-10-01"
      }
    }
  } catch (error) {
    console.error("Error getting setup times by cell:", error)
    return {
      isSuccess: false,
      message: "Failed to get setup times"
    }
  }
}

// Update setup times
export async function updateSetupTimesAction(setupTimesId: string, data: Partial<SetupTimesInput>): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = setupTimesSchema.partial().parse(data)
    
    // This is a simplified mock implementation
    console.log("Updating setup times:", setupTimesId, validatedData)
    
    return {
      isSuccess: true,
      message: "Setup times updated successfully",
      data: {
        id: setupTimesId,
        ...validatedData,
        updatedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid setup times data"
      }
    }
    
    console.error("Error updating setup times:", error)
    return {
      isSuccess: false,
      message: "Failed to update setup times"
    }
  }
}

// Delete setup times
export async function deleteSetupTimesAction(setupTimesId: string): Promise<ActionState<void>> {
  try {
    // This is a simplified mock implementation
    console.log("Deleting setup times:", setupTimesId)
    
    return {
      isSuccess: true,
      message: "Setup times deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting setup times:", error)
    return {
      isSuccess: false,
      message: "Failed to delete setup times"
    }
  }
} 