"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { valueStreamsTable, sitesTable, SelectValueStream } from "@/db/schema"

// Validation schema for value streams
const valueStreamSchema = z.object({
  name: z.string().min(1, "Value stream name is required"),
  description: z.string().optional(),
  siteId: z.string().uuid("Invalid site ID")
})

type ValueStreamInput = z.infer<typeof valueStreamSchema>

// Create a new value stream
export async function createValueStreamAction(data: ValueStreamInput): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = valueStreamSchema.parse(data)
    
    // Insert value stream into database
    const [newValueStream] = await db.insert(valueStreamsTable).values(validatedData).returning()
    
    return {
      isSuccess: true,
      message: "Value stream created successfully",
      data: newValueStream
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid value stream data"
      }
    }
    
    console.error("Error creating value stream:", error)
    return {
      isSuccess: false,
      message: "Failed to create value stream"
    }
  }
}

// Get all value streams
export async function getValueStreamsAction(): Promise<ActionState<SelectValueStream[]>> {
  try {
    const valueStreams = await db
      .select()
      .from(valueStreamsTable)
      .orderBy(valueStreamsTable.name)
    
    return {
      isSuccess: true,
      message: "Value streams retrieved successfully",
      data: valueStreams
    }
  } catch (error) {
    console.error("Error getting value streams:", error)
    return {
      isSuccess: false,
      message: "Failed to get value streams"
    }
  }
}

// Get value streams by site ID
export async function getValueStreamsBySiteIdAction(siteId: string): Promise<ActionState<SelectValueStream[]>> {
  try {
    const valueStreams = await db
      .select()
      .from(valueStreamsTable)
      .where(eq(valueStreamsTable.siteId, siteId))
      .orderBy(valueStreamsTable.name)
    
    return {
      isSuccess: true,
      message: "Value streams retrieved successfully",
      data: valueStreams
    }
  } catch (error) {
    console.error("Error getting value streams:", error)
    return {
      isSuccess: false,
      message: "Failed to get value streams"
    }
  }
}

// Get a value stream by ID
export async function getValueStreamByIdAction(valueStreamId: string): Promise<ActionState<any>> {
  try {
    const valueStream = await db.query.valueStreams.findFirst({
      where: eq(valueStreamsTable.id, valueStreamId),
      with: {
        site: {
          with: {
            company: true
          }
        }
      }
    })
    
    if (!valueStream) {
      return {
        isSuccess: false,
        message: "Value stream not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Value stream retrieved successfully",
      data: valueStream
    }
  } catch (error) {
    console.error("Error getting value stream:", error)
    return {
      isSuccess: false,
      message: "Failed to get value stream"
    }
  }
}

// Update a value stream
export async function updateValueStreamAction(valueStreamId: string, data: Partial<ValueStreamInput>): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = valueStreamSchema.partial().parse(data)
    
    // Update value stream in database
    const [updatedValueStream] = await db
      .update(valueStreamsTable)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(valueStreamsTable.id, valueStreamId))
      .returning()
    
    if (!updatedValueStream) {
      return {
        isSuccess: false,
        message: "Value stream not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Value stream updated successfully",
      data: updatedValueStream
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid value stream data"
      }
    }
    
    console.error("Error updating value stream:", error)
    return {
      isSuccess: false,
      message: "Failed to update value stream"
    }
  }
}

// Delete a value stream
export async function deleteValueStreamAction(valueStreamId: string): Promise<ActionState<void>> {
  try {
    await db.delete(valueStreamsTable).where(eq(valueStreamsTable.id, valueStreamId))
    
    return {
      isSuccess: true,
      message: "Value stream deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting value stream:", error)
    return {
      isSuccess: false,
      message: "Failed to delete value stream"
    }
  }
} 