"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { 
  bottleneckAnalysisTable, 
  productionMachinesTable as machinesTable, 
  cellsTable
} from "@/db/schema"
import { SelectBottleneckAnalysis, InsertBottleneckAnalysis } from "@/db/schema/metrics-schema"
import { and, between, eq, desc, sql } from "drizzle-orm"
import { format, parseISO, isValid } from "date-fns"
import { z } from "zod"

// Validation schema for bottleneck analysis parameters
const bottleneckAnalysisParamsSchema = z.object({
  cellId: z.string().uuid("Invalid cell ID"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
})

// Validation schema for creating a bottleneck analysis
const createBottleneckSchema = z.object({
  cellId: z.string().uuid("Invalid cell ID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  bottleneckMachineId: z.string().optional().nullable(),
  bottleneckSeverity: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
})

// Validation schema for updating a bottleneck analysis
const updateBottleneckSchema = z.object({
  id: z.string().uuid("Invalid bottleneck analysis ID"),
  bottleneckMachineId: z.string().optional().nullable(),
  bottleneckSeverity: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
})

// Validation schema for deleting a bottleneck analysis
const deleteBottleneckSchema = z.object({
  id: z.string().uuid("Invalid bottleneck analysis ID")
})

interface BottleneckAnalysisParams {
  cellId: string
  startDate: string
  endDate: string
}

/**
 * Creates a new bottleneck analysis record in the database
 * Following backend patterns from backend.mdc
 */
export async function createBottleneckAnalysisAction(
  data: Partial<InsertBottleneckAnalysis>
): Promise<ActionState<SelectBottleneckAnalysis>> {
  try {
    // Validate input
    const validated = createBottleneckSchema.parse(data);
    
    // Execute database operation
    const [newBottleneck] = await db.insert(bottleneckAnalysisTable)
      .values(validated as InsertBottleneckAnalysis)
      .returning();
    
    return {
      isSuccess: true,
      message: "Bottleneck analysis created successfully",
      data: newBottleneck
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors.map(e => e.message).join(", ")
      };
    }
    
    console.error("Error creating bottleneck analysis:", error);
    return {
      isSuccess: false,
      message: "Failed to create bottleneck analysis"
    };
  }
}

/**
 * Updates an existing bottleneck analysis record in the database
 * Following backend patterns from backend.mdc
 */
export async function updateBottleneckAnalysisAction(
  id: string,
  data: Partial<InsertBottleneckAnalysis>
): Promise<ActionState<SelectBottleneckAnalysis>> {
  try {
    // Validate input
    const validated = updateBottleneckSchema.parse({ id, ...data });
    
    // Remove id from the data to be updated
    const { id: _, ...updateData } = validated;
    
    // Execute database operation
    const [updatedBottleneck] = await db.update(bottleneckAnalysisTable)
      .set(updateData)
      .where(eq(bottleneckAnalysisTable.id, id))
      .returning();
    
    if (!updatedBottleneck) {
      return {
        isSuccess: false,
        message: "Bottleneck analysis not found"
      };
    }
    
    return {
      isSuccess: true,
      message: "Bottleneck analysis updated successfully",
      data: updatedBottleneck
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors.map(e => e.message).join(", ")
      };
    }
    
    console.error("Error updating bottleneck analysis:", error);
    return {
      isSuccess: false,
      message: "Failed to update bottleneck analysis"
    };
  }
}

/**
 * Deletes a bottleneck analysis record from the database
 * Following backend patterns from backend.mdc
 */
export async function deleteBottleneckAnalysisAction(
  id: string
): Promise<ActionState<void>> {
  try {
    // Validate input
    const validated = deleteBottleneckSchema.parse({ id });
    
    // Execute database operation
    await db.delete(bottleneckAnalysisTable)
      .where(eq(bottleneckAnalysisTable.id, validated.id));
    
    return {
      isSuccess: true,
      message: "Bottleneck analysis deleted successfully",
      data: undefined
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors.map(e => e.message).join(", ")
      };
    }
    
    console.error("Error deleting bottleneck analysis:", error);
    return {
      isSuccess: false,
      message: "Failed to delete bottleneck analysis"
    };
  }
}

/**
 * Retrieves bottleneck analysis data from the database for a specific cell and date range
 * Following backend patterns from backend.mdc
 */
export async function getBottleneckAnalysisAction(
  params?: BottleneckAnalysisParams
): Promise<ActionState<SelectBottleneckAnalysis[]>> {
  try {
    // Validate parameters
    if (!params) {
      return {
        isSuccess: false,
        message: "Missing required parameters"
      }
    }
    
    try {
      const validatedParams = bottleneckAnalysisParamsSchema.parse(params);
      const { cellId, startDate, endDate } = validatedParams;
      
      console.log(`Getting bottleneck analysis for cell: ${cellId} from ${startDate} to ${endDate}`);
      
      // Query database for bottleneck analysis data
      const bottlenecks = await db.query.bottleneckAnalysis.findMany({
        where: and(
          eq(bottleneckAnalysisTable.cellId, cellId),
          sql`${bottleneckAnalysisTable.date} >= ${startDate}`,
          sql`${bottleneckAnalysisTable.date} <= ${endDate}`
        ),
        orderBy: [desc(bottleneckAnalysisTable.date)]
      });
      
      console.log(`Found ${bottlenecks.length} bottleneck analyses in database`);
      
      return {
        isSuccess: true,
        message: bottlenecks.length > 0 
          ? "Bottleneck analysis retrieved successfully" 
          : "No bottleneck analyses found for the specified parameters",
        data: bottlenecks
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isSuccess: false,
          message: error.errors.map(e => e.message).join(", ")
        };
      }
      
      console.error("Error retrieving bottleneck analysis:", error);
      return {
        isSuccess: false,
        message: "Failed to retrieve bottleneck analysis"
      };
    }
  } catch (error) {
    console.error("Unexpected error in bottleneck analysis action:", error);
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    };
  }
}