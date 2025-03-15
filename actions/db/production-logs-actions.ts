"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq, and, sql, inArray, or } from "drizzle-orm"
import { 
  productionLogsTable, 
  productionMachinesTable, 
  downtimeLogsTable,
  downtimeReasonEnum,
  InsertProductionLog,
  InsertDowntimeLog,
  cellsTable,
  machinesTable,
  profilesTable,
  partsTable
} from "@/db/schema"
import { gte, lte, desc } from "drizzle-orm"
import { calculateMachineEfficiencyAction, recalculateAttainmentAction } from "./efficiency-metrics-actions"
import { format } from "date-fns"

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
  startDate: string | Date,
  endDate: string | Date
): Promise<ActionState<any[]>> {
  try {
    // Clean input data to prevent SQL injection
    const cleanCellId = cellId.trim();
    
    // Set the time components of the dates to ensure full day coverage
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    console.log(`Querying production logs for cell ${cleanCellId}`);
    console.log(`Date range: ${start.toLocaleString()} to ${end.toLocaleString()}`);
    
    // Special check for March 13-14 data
    const isMarch13or14 = (start.getMonth() === 2 && (start.getDate() === 13 || start.getDate() === 14)) ||
                         (end.getMonth() === 2 && (end.getDate() === 13 || end.getDate() === 14)) ||
                         (start.getMonth() === 2 && start.getDate() <= 13 && end.getMonth() === 2 && end.getDate() >= 14);
    
    if (isMarch13or14) {
      console.log("📅 Special date range detected: Looking for March 13-14 data");
    }
    
    // First, check if we're using a mock cell ID (for development/testing)
    const isMockCell = cleanCellId.startsWith('mock-')
    
    if (isMockCell) {
      // Generate mock data for testing
      return generateMockProductionLogs(cleanCellId, start, end)
    }
    
    // For real cell IDs, query the database
    try {
      // Get the cell name for reference
      const cell = await db.query.cells.findFirst({
        where: eq(cellsTable.id, cleanCellId)
      })
      
      if (!cell) {
        return {
          isSuccess: false,
          message: `Cell with ID ${cleanCellId} not found`
        }
      }
      
      // Get all machines that belong to this cell
      const machines = await db.query.machines.findMany({
        where: eq(machinesTable.cellId, cleanCellId)
      })
      
      if (machines.length === 0) {
        return {
          isSuccess: true,
          message: "No machines found for this cell",
          data: []
        }
      }
      
      const machineIds = machines.map(machine => machine.id)
      
      // Fetch all available parts for reference
      const allParts = await db.query.parts.findMany()
      
      // Query production logs from the database for these machines
      try {
        // Following backend.mdc guidelines:
        // 1. Use type-safe queries instead of raw SQL
        // 2. Use Date objects directly with Drizzle ORM for date comparisons
        // 3. Use parameter binding via Drizzle ORM for security and reliability
        
        // First get parts previously used with these machines for mapping
        const previousLogs = await db
          .select({
            logs: productionLogsTable,
            machine: machinesTable
          })
          .from(productionLogsTable)
          .innerJoin(
            machinesTable,
            eq(productionLogsTable.machineId, machinesTable.id)
          )
          .where(inArray(productionLogsTable.machineId, machineIds))
          .orderBy(desc(productionLogsTable.createdAt))
          .limit(50);
          
        // Create a map of parts previously used with each machine
        const machinePartHistory = new Map();
        for (const log of previousLogs) {
          // Try to extract part number from notes
          const partMatch = log.logs.notes?.match(/part:([^|]+)/);
          const partIdMatch = log.logs.notes?.match(/partId:([^|]+)/);
          
          if (partIdMatch && partIdMatch[1]) {
            // If we have a direct part ID, use that for matching
            const partId = partIdMatch[1].trim();
            const matchedPart = allParts.find(p => p.id === partId);
            
            if (matchedPart) {
              if (!machinePartHistory.has(log.machine.id)) {
                machinePartHistory.set(log.machine.id, []);
              }
              // Add to history only if we haven't seen this part for this machine before
              const history = machinePartHistory.get(log.machine.id);
              if (!history.find((p: any) => p.id === matchedPart.id)) {
                history.push(matchedPart);
              }
            }
          } else if (partMatch && partMatch[1]) {
            const partNumber = partMatch[1].trim();
            
            // Try to find matching part
            const matchedPart = allParts.find(p => 
              p.partNumber === partNumber || 
              p.partNumber.includes(partNumber) || 
              partNumber.includes(p.partNumber)
            );
            
            if (matchedPart) {
              if (!machinePartHistory.has(log.machine.id)) {
                machinePartHistory.set(log.machine.id, []);
              }
              // Add to history only if we haven't seen this part for this machine before
              const history = machinePartHistory.get(log.machine.id);
              if (!history.find((p: any) => p.id === matchedPart.id)) {
                history.push(matchedPart);
              }
            }
          }
        }
        
        // Create a mapping between machines and potential parts
        const machineToParts = new Map();
        for (const machine of machines) {
          // First check if we have a history for this machine
          if (machinePartHistory.has(machine.id) && machinePartHistory.get(machine.id).length > 0) {
            // Use the most recently used part for this machine
            machineToParts.set(machine.id, machinePartHistory.get(machine.id)[0]);
            continue;
          }
          
          // If no history, try to find parts by name matching
          const possibleParts = allParts.filter(part => 
            machine.name && (
              part.partNumber.includes(machine.name) || 
              machine.name.includes(part.partNumber) ||
              // Also check for numeric part identifiers
              (part.partNumber.match(/\d+/) && machine.name.includes(part.partNumber.match(/\d+/)?.[0] || ''))
            )
          );
          
          if (possibleParts.length > 0) {
            machineToParts.set(machine.id, possibleParts[0]);
          }
        }
        
        const logs = await db
          .select({
            logs: productionLogsTable,
            machine: machinesTable,
            profile: profilesTable,
          })
          .from(productionLogsTable)
          .innerJoin(
            machinesTable, 
            eq(productionLogsTable.machineId, machinesTable.id)
          )
          .leftJoin(
            profilesTable,
            eq(productionLogsTable.userId, profilesTable.userId)
          )
          .where(
            and(
              // Handle empty array edge case
              machineIds.length > 0 
                ? inArray(productionLogsTable.machineId, machineIds)
                : eq(productionLogsTable.machineId, '00000000-0000-0000-0000-000000000000'), // dummy value that won't match
              
              // Use date range filtering with proper Date objects
              gte(productionLogsTable.createdAt, start),
              lte(productionLogsTable.createdAt, end)
            )
          )
          .orderBy(desc(productionLogsTable.createdAt))
        
        console.log(`Found ${logs.length} production logs for cell ${cleanCellId} between ${start.toLocaleString()} and ${end.toLocaleString()}`)
        
        // If no logs found, return an empty array with success
        if (logs.length === 0) {
          return {
            isSuccess: true,
            message: "No production logs found for the given date range",
            data: []
          }
        }

        // Special check for March 13-14 data
        const specialDates = ["2025-03-13", "2025-03-14"];
        const specialDateLogs = logs.filter(log => {
          const logDate = new Date(log.logs.createdAt).toISOString().split('T')[0];
          return specialDates.includes(logDate);
        });
        
        if (specialDateLogs.length > 0) {
          console.log(`Found ${specialDateLogs.length} logs for March 13-14`);
        }

        // Format logs with part information
        const formattedLogs = logs.map(log => {
          // Default values if we can't determine part info
          let partNumber = "Unknown";
          let description = "Unknown";
          let associatedPart = null;

          // First try to extract part info from the log notes if available
          if (log.logs.notes) {
            // Check for partId in notes first (most accurate)
            const partIdMatch = log.logs.notes.match(/partId:([^|]+)/);
            if (partIdMatch && partIdMatch[1]) {
              const partId = partIdMatch[1].trim();
              const directPart = allParts.find(p => p.id === partId);
              if (directPart) {
                partNumber = directPart.partNumber;
                description = directPart.description;
                associatedPart = directPart;
              }
            } else {
              // If no partId, try part number from notes
              const partMatch = log.logs.notes.match(/part:([^|]+)/);
              if (partMatch && partMatch[1]) {
                const extractedPartNumber = partMatch[1].trim();
                // Try to find the part by number
                const matchedPart = allParts.find(p => 
                  p.partNumber === extractedPartNumber || 
                  p.partNumber.includes(extractedPartNumber) || 
                  extractedPartNumber.includes(p.partNumber)
                );
                
                if (matchedPart) {
                  partNumber = matchedPart.partNumber;
                  description = matchedPart.description;
                  associatedPart = matchedPart;
                } else {
                  // If we can't find the part, use the extracted part number
                  partNumber = extractedPartNumber;
                  
                  // Try to extract description too if available
                  const descMatch = log.logs.notes.match(/desc:([^|]+)/);
                  if (descMatch && descMatch[1]) {
                    description = descMatch[1].trim();
                  }
                }
              }
            }
          }
          
          // If we couldn't determine part info from notes, check the machine part history
          if (partNumber === "Unknown" && machineToParts.has(log.logs.machineId)) {
            const part = machineToParts.get(log.logs.machineId);
            partNumber = part.partNumber;
            description = part.description;
            associatedPart = part;
          }

          // Calculate cycle times and other derived values
          const standardCycleTime = log.machine.standardCycleTime ? Math.round(Number(log.machine.standardCycleTime) / 60) : 0;
          const actualCycleTime = log.logs.actualCycleTime ? Math.round(Number(log.logs.actualCycleTime) / 60) : 0;
          const timeDifference = actualCycleTime - standardCycleTime;

          return {
            id: log.logs.id,
            date: log.logs.createdAt,
            shift: "1st", // Default shift since it doesn't exist in schema
            cellId: cleanCellId,
            cellName: cell.name,
            partNumber,
            description,
            quantity: log.logs.partsProduced || 1,
            standardTime: standardCycleTime, // Already converted to minutes
            actualTime: actualCycleTime, // Already converted to minutes
            difference: timeDifference,
            efficiency: Number(log.logs.efficiency) || 100,
            completed: log.logs.endTime !== null,
            userName: log.profile ? `User ${log.profile.userId.substring(0, 8)}` : "Unknown User",
            machineId: log.machine.id,
            machineName: log.machine.name || "Machine",
            userId: log.logs.userId,
            startTime: log.logs.startTime,
            endTime: log.logs.endTime,
            notes: log.logs.notes,
            associatedPart
          };
        });

        return {
          isSuccess: true,
          message: "Production logs retrieved successfully",
          data: formattedLogs
        };
      } catch (error) {
        console.error("Error retrieving production logs:", error);
        return {
          isSuccess: false,
          message: "Error retrieving production logs"
        };
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

    // Enhance the notes with actual part information
    if (validatedData.productionRuns.length > 0) {
      try {
        // Get all parts from the database first
        const allParts = await db.query.parts.findMany();
        
        // Get the most produced part or the first part if quantities are equal
        const primaryRun = [...validatedData.productionRuns].sort((a, b) => b.quantity - a.quantity)[0];
        
        // Calculate total parts produced
        const totalPartsProduced = validatedData.productionRuns.reduce((sum, run) => sum + run.quantity, 0);
        
        // Extract target information from metrics
        const attainmentPercentage = validatedData.metrics.attainmentPercentage;
        
        // If we have attainment percentage, we can calculate the target
        // attainment = (actual/target) * 100, so target = (actual*100)/attainment
        const targetCount = attainmentPercentage > 0 
          ? Math.round((totalPartsProduced * 100) / attainmentPercentage) 
          : totalPartsProduced; // If no attainment, use produced as target
        
        // Try to find the matching part in the database
        const matchedPart = allParts.find(part => 
          part.partNumber === primaryRun.partNumber || 
          part.id === primaryRun.partId
        );
        
        if (matchedPart) {
          // Use the database part information for accuracy
          productionData.notes = `Saved ${validatedData.productionRuns.length} runs from production screen | part:${matchedPart.partNumber} | description:${matchedPart.description} | quantity:${primaryRun.quantity}`;
          // Also store the part ID directly in the notes for easier lookups
          productionData.notes += ` | partId:${matchedPart.id}`;
          // Add target information for attainment calculation
          productionData.notes += ` | target:${targetCount}`;
          // Explicitly save targetCount as a separate field
          productionData.targetCount = String(targetCount);
        } else {
          // Fall back to the data provided in the input
          productionData.notes = `Saved ${validatedData.productionRuns.length} runs from production screen | part:${primaryRun.partNumber} | description:${primaryRun.partDescription} | quantity:${primaryRun.quantity}`;
          // Add target information for attainment calculation
          productionData.notes += ` | target:${targetCount}`;
          // Explicitly save targetCount as a separate field
          productionData.targetCount = String(targetCount);
        }
        
        // If there are multiple parts, add a summary
        if (validatedData.productionRuns.length > 1) {
          productionData.notes += ` | additional_parts:${validatedData.productionRuns.length - 1}`;
        }
      } catch (partLookupError) {
        console.warn("Failed to lookup part details:", partLookupError);
        // Fall back to basic info if part lookup fails
        const primaryRun = [...validatedData.productionRuns].sort((a, b) => b.quantity - a.quantity)[0];
        const totalQuantity = validatedData.productionRuns.reduce((sum, run) => sum + run.quantity, 0);
        
        // Add basic information to the notes
        productionData.notes = `Saved ${validatedData.productionRuns.length} runs from production screen | part:${primaryRun.partNumber} | quantity:${primaryRun.quantity}`;
        // Add target information for attainment calculation (using 100% attainment as fallback)
        productionData.notes += ` | target:${totalQuantity}`;
        // Explicitly save targetCount as a separate field
        productionData.targetCount = String(totalQuantity);
      }
    }

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
      
      // Automatically calculate efficiency metrics for the current date
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      
      try {
        // Call the action to calculate efficiency metrics
        console.log(`Automatically calculating efficiency metrics for cell ${validatedData.cellId} on ${formattedDate}`);
        await calculateMachineEfficiencyAction({
          cellId: validatedData.cellId,
          date: formattedDate
        });
        console.log("Efficiency metrics calculation triggered successfully");
        
        // Also check if attainment needs to be recalculated for this day
        try {
          console.log("Checking if attainment calculation is needed...");
          await recalculateAttainmentAction(validatedData.cellId, {
            startDate: formattedDate,
            endDate: formattedDate
          });
        } catch (attainmentError) {
          console.error("Error recalculating attainment:", attainmentError);
        }
      } catch (metricsError) {
        // Don't fail the entire operation if metrics calculation fails
        console.error("Failed to calculate efficiency metrics:", metricsError);
      }
      
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