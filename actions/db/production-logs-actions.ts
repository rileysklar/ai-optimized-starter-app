"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq, and, sql } from "drizzle-orm"
import { 
  productionLogsTable, 
  productionMachinesTable, 
  downtimeLogsTable,
  downtimeReasonEnum,
  InsertProductionLog,
  InsertDowntimeLog,
  cellsTable,
  machinesTable
} from "@/db/schema"
import { gte, lte, desc } from "drizzle-orm"

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

// Helper function to generate mock data for testing
function generateMockProductionLogs(cellId: string, start: Date, end: Date): ActionState<any[]> {
  const mockData = []
  
  // Create a date iterator
  const currentDate = new Date(start)
  
  // Generate data for each day in the range
  while (currentDate <= end) {
    // Generate 1-3 entries per day
    const entriesPerDay = Math.floor(Math.random() * 3) + 1
    
    for (let i = 0; i < entriesPerDay; i++) {
      // Randomize part details
      const partNumber = `PART-${1000 + Math.floor(Math.random() * 9000)}`
      const description = `${['Aluminum', 'Steel', 'Plastic', 'Composite'][Math.floor(Math.random() * 4)]} ${['Bracket', 'Housing', 'Connector', 'Frame', 'Support'][Math.floor(Math.random() * 5)]}`
      const standardTime = Math.floor(Math.random() * 20) + 5 // 5-25 minutes
      
      // Randomize actual time with some variance
      const variance = (Math.random() * 0.4) - 0.2 // -20% to +20%
      const actualTime = Math.max(1, Math.round(standardTime * (1 + variance)))
      
      // Calculate difference and efficiency
      const difference = actualTime - standardTime
      const efficiency = Math.round((standardTime / actualTime) * 100)
      
      // Create the log entry
      mockData.push({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: new Date(currentDate).toISOString(),
        shift: ['1st', '2nd', '3rd'][Math.floor(Math.random() * 3)],
        cellId,
        cellName: `Cell ${cellId.slice(-1).toUpperCase()}`,
        partNumber,
        description,
        quantity: Math.floor(Math.random() * 10) + 1, // 1-10 parts
        standardTime,
        actualTime,
        difference,
        efficiency,
        completed: true
      })
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return {
    isSuccess: true,
    message: "Mock production logs retrieved successfully",
    data: mockData
  }
}

// Get production logs by date range
export async function getProductionLogsByDateRangeAction(
  cellId: string,
  startDate: string,
  endDate: string
): Promise<ActionState<any[]>> {
  try {
    console.log("Getting production logs for cell:", cellId, "from", startDate, "to", endDate)
    
    // Parse dates to ensure proper format
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Set end date to end of day
    end.setHours(23, 59, 59, 999)
    
    // First, check if we're using a mock cell ID (for development/testing)
    const isMockCell = cellId.startsWith('mock-')
    
    if (isMockCell) {
      // Generate mock data for testing
      return generateMockProductionLogs(cellId, start, end)
    }
    
    // For real cell IDs, query the database
    try {
      // Get the cell name for reference
      const cell = await db.query.cells.findFirst({
        where: eq(cellsTable.id, cellId)
      })
      
      if (!cell) {
        return {
          isSuccess: false,
          message: `Cell with ID ${cellId} not found`
        }
      }
      
      // First get all machines that belong to this cell
      const machines = await db.query.machines.findMany({
        where: eq(machinesTable.cellId, cellId)
      })
      
      if (machines.length === 0) {
        return {
          isSuccess: true,
          message: "No machines found for this cell",
          data: []
        }
      }
      
      const machineIds = machines.map(machine => machine.id)
      
      // Query production logs from the database for these machines
      const logs = await db
        .select({
          logs: productionLogsTable,
          machine: machinesTable
        })
        .from(productionLogsTable)
        .innerJoin(machinesTable, eq(productionLogsTable.machineId, machinesTable.id))
        .where(
          and(
            sql`${productionLogsTable.machineId} IN (${machineIds.join(',')})`,
            gte(productionLogsTable.createdAt, start),
            lte(productionLogsTable.createdAt, end)
          )
        )
        .orderBy(desc(productionLogsTable.createdAt))
      
      console.log(`Found ${logs.length} production logs for cell ${cellId}`)
      
      // Transform the data to match the expected format
      const formattedLogs = logs.map(log => {
        const productionLog = log.logs;
        const standardCycleTime = log.machine.standardCycleTime ? Math.round(Number(log.machine.standardCycleTime) / 60) : 0;
        const actualCycleTime = productionLog.actualCycleTime ? Math.round(Number(productionLog.actualCycleTime) / 60) : 0;
        const timeDifference = actualCycleTime && standardCycleTime ? actualCycleTime - standardCycleTime : 0;
        
        return {
          id: productionLog.id,
          date: productionLog.createdAt,
          shift: "1st", // Default shift since it doesn't exist in schema
          cellId: cellId,
          cellName: cell.name,
          partNumber: log.machine.name || "Unknown", // Using machine name as part number
          description: productionLog.notes || "Unknown",
          quantity: productionLog.partsProduced || 1,
          standardTime: standardCycleTime, // Already converted to minutes
          actualTime: actualCycleTime, // Already converted to minutes
          difference: timeDifference,
          efficiency: Number(productionLog.efficiency) || 100,
          completed: productionLog.endTime !== null
        }
      })
      
      return {
        isSuccess: true,
        message: `Retrieved ${formattedLogs.length} production logs successfully`,
        data: formattedLogs
      }
    } catch (dbError) {
      console.error("Database error fetching production logs:", dbError)
      return {
        isSuccess: false,
        message: "Database error: Failed to retrieve production logs"
      }
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
      const machines = await db.select().from(productionMachinesTable).where(eq(productionMachinesTable.cellId, validatedData.cellId))
      
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error saving production data:", error);
    
    return {
      isSuccess: false,
      message: `Error saving production data: ${errorMessage}`
    };
  }
}