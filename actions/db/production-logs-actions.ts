"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq, and, sql } from "drizzle-orm"
import { productionLogsTable, machinesTable } from "@/db/schema"

// Validation schema for starting a production run
const startProductionSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  machineId: z.string().uuid("Invalid machine ID"),
  startTime: z.string().min(1, "Start time is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer")
})

// Validation schema for completing a production cycle
const completeProductionCycleSchema = z.object({
  runId: z.string().uuid("Invalid run ID"),
  machineNumber: z.number().int().min(1).max(4, "Machine number must be between 1 and 4"),
  completeTime: z.string().min(1, "Complete time is required")
})

// Validation schema for saving production screen data
const saveProductionScreenSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  cellId: z.string().min(1, "Cell ID is required"),
  date: z.string().min(1, "Date is required"),
  shift: z.string().min(1, "Shift is required"),
  productionRuns: z.array(
    z.object({
      id: z.string(),
      partId: z.string(),
      partNumber: z.string(),
      partDescription: z.string(),
      quantity: z.number(),
      standardTime: z.number(),
      startTime: z.date(),
      completed: z.boolean(),
      machine1CompleteTime: z.date().nullable(),
      machine2CompleteTime: z.date().nullable(),
      machine3CompleteTime: z.date().nullable(),
      machine4CompleteTime: z.date().nullable(),
      lunchBreak: z.boolean(),
      timeDifference: z.number(),
      reasonForTimeDifference: z.string()
    })
  ),
  metrics: z.object({
    attainmentPercentage: z.number(),
    totalLossMinutes: z.number(),
    totalBreakMinutes: z.number(),
    lossPercentage: z.number()
  })
})

// Start a new production run
export async function startProductionRunAction(data: z.infer<typeof startProductionSchema>): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = startProductionSchema.parse(data)
    
    // This is a simplified mock implementation
    console.log("Starting production run:", validatedData)
    
    return {
      isSuccess: true,
      message: "Production run started successfully",
      data: {
        id: `run-${Date.now()}`,
        ...validatedData,
        status: "running"
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid input data"
      }
    }
    
    console.error("Error starting production run:", error)
    return {
      isSuccess: false,
      message: "Failed to start production run"
    }
  }
}

// Complete a production cycle
export async function completeProductionCycleAction(data: z.infer<typeof completeProductionCycleSchema>): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = completeProductionCycleSchema.parse(data)
    
    // This is a simplified mock implementation
    console.log("Completing production cycle:", validatedData)
    
    return {
      isSuccess: true,
      message: "Production cycle completed successfully",
      data: {
        id: validatedData.runId,
        machineNumber: validatedData.machineNumber,
        completeTime: validatedData.completeTime
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid input data"
      }
    }
    
    console.error("Error completing production cycle:", error)
    return {
      isSuccess: false,
      message: "Failed to complete production cycle"
    }
  }
}

// Get all production logs for a cell
export async function getProductionLogsByCellAction(cellId: string): Promise<ActionState<any[]>> {
  try {
    // This is a simplified mock implementation
    console.log("Getting production logs for cell:", cellId)
    
    return {
      isSuccess: true,
      message: "Production logs retrieved successfully",
      data: [
        {
          id: "mock-log-1",
          machineId: "machine-1",
          userId: "user-1",
          startTime: new Date().toISOString(),
          partsProduced: 10,
          status: "completed"
        },
        {
          id: "mock-log-2",
          machineId: "machine-2",
          userId: "user-1",
          startTime: new Date().toISOString(),
          partsProduced: 5,
          status: "running"
        }
      ]
    }
  } catch (error) {
    console.error("Error getting production logs:", error)
    return {
      isSuccess: false,
      message: "Failed to get production logs"
    }
  }
}

// Get production logs by date range
export async function getProductionLogsByDateRangeAction(
  cellId: string,
  startDate: string,
  endDate: string
): Promise<ActionState<any[]>> {
  try {
    // This is a simplified mock implementation
    console.log("Getting production logs for cell:", cellId, "from", startDate, "to", endDate)
    
    return {
      isSuccess: true,
      message: "Production logs retrieved successfully",
      data: [
        {
          id: "mock-log-1",
          machineId: "machine-1",
          userId: "user-1",
          startTime: startDate + "T09:00:00Z",
          partsProduced: 10,
          status: "completed"
        },
        {
          id: "mock-log-2",
          machineId: "machine-2",
          userId: "user-1",
          startTime: endDate + "T14:30:00Z",
          partsProduced: 5,
          status: "completed"
        }
      ]
    }
  } catch (error) {
    console.error("Error getting production logs:", error)
    return {
      isSuccess: false,
      message: "Failed to get production logs"
    }
  }
}

// Save production screen data
export async function saveProductionScreenAction(data: z.infer<typeof saveProductionScreenSchema>): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = saveProductionScreenSchema.parse(data)
    
    // In a real implementation, this would save the data to the database
    // For now, we'll mock this since the actual DB schema isn't fully implemented
    console.log("Saving production screen data:", validatedData)
    
    // Here we would:
    // 1. Save or update each production run in the database
    // 2. Save the efficiency metrics
    // 3. Associate everything with the user, cell, date, and shift
    
    return {
      isSuccess: true,
      message: "Production data saved successfully",
      data: {
        id: `screen-${Date.now()}`,
        ...validatedData
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid input data"
      }
    }
    
    console.error("Error saving production screen data:", error)
    return {
      isSuccess: false,
      message: "Failed to save production screen data"
    }
  }
} 