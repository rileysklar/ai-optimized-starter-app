"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq, and, sql } from "drizzle-orm"
import { 
  productionLogsTable, 
  machinesTable, 
  downtimeLogsTable,
  downtimeReasonEnum,
  InsertProductionLog,
  InsertDowntimeLog
} from "@/db/schema"

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
    
    // Log the validated data for debugging
    console.log("Saving production screen data:", JSON.stringify(validatedData, null, 2))

    // Handle the mock cell ID case specifically (for development/testing)
    const isMockCell = validatedData.cellId.startsWith('mock-');
    
    // For production log entry
    let productionData: any = {
      userId: validatedData.userId,
      startTime: new Date(),
      partsProduced: validatedData.productionRuns.reduce((sum, run) => sum + run.quantity, 0),
      notes: `Saved ${validatedData.productionRuns.length} runs from production screen`
    };

    // Mock implementation for development/testing
    if (isMockCell) {
      console.log("Using mock implementation for cell:", validatedData.cellId);
      
      // Mock the production log entry with fake data
      // This won't actually save to the database but will show success in UI
      return {
        isSuccess: true,
        message: "Production data saved successfully (mock mode)",
        data: {
          productionLog: {
            id: `mock-log-${Date.now()}`,
            ...productionData,
            machineId: "00000000-0000-0000-0000-000000000000", // Mock machine ID
            createdAt: new Date(),
            updatedAt: new Date()
          },
          isMockMode: true,
          savedRuns: validatedData.productionRuns.length,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Regular implementation for real cell IDs
    try {
      // First, verify the cell ID is a valid UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validatedData.cellId)) {
        console.error("Invalid cell ID format:", validatedData.cellId);
        return {
          isSuccess: false,
          message: "Invalid cell ID format. Must be a valid UUID."
        };
      }
      
      // Query for a machine that belongs to the selected cell
      const machines = await db.select().from(machinesTable).where(eq(machinesTable.cellId, validatedData.cellId))
      
      console.log("Found machines for cell:", machines)
      
      // Set the machine ID for the production log
      if (machines && machines.length > 0) {
        productionData.machineId = machines[0].id;
      } else {
        console.error("No machines found for cell ID:", validatedData.cellId);
        return {
          isSuccess: false,
          message: "No machines found for the selected cell. Please set up machines for this cell first."
        };
      }
      
      // Now we have a valid machine ID, save the production log
      console.log("Inserting production log with data:", productionData);
      
      const [productionLog] = await db.insert(productionLogsTable)
        .values(productionData)
        .returning();
      
      console.log("Successfully inserted production log:", productionLog);
      
      return {
        isSuccess: true,
        message: "Production data saved successfully",
        data: {
          productionLog,
          savedRuns: validatedData.productionRuns.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error("Database error while saving production data:", dbError);
      console.error("Full error details:", dbError);
      
      return {
        isSuccess: false,
        message: `Database error: ${errorMessage}. Details: ${JSON.stringify(productionData)}`
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid input data"
      };
    }
    
    console.error("Error saving production screen data:", error);
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to save production screen data"
    };
  }
}

// Helper function to determine the downtime reason enum value from the text reason
function determineDowntimeReason(reasonText: string): string {
  if (!reasonText) return "other"
  
  const lowerReason = reasonText.toLowerCase()
  
  if (lowerReason.includes("setup") || lowerReason.includes("set up")) return "setup"
  if (lowerReason.includes("break") || lowerReason.includes("breakdown")) return "breakdown"
  if (lowerReason.includes("material") || lowerReason.includes("shortage")) return "material_shortage"
  if (lowerReason.includes("quality")) return "quality_issue"
  if (lowerReason.includes("change") || lowerReason.includes("changeover")) return "changeover"
  if (lowerReason.includes("maintenance")) return "scheduled_maintenance"
  
  return "other"
} 