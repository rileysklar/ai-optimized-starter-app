"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq, inArray } from "drizzle-orm"
import { machinesTable, cellsTable, SelectMachine } from "@/db/schema"

// Validation schema for machines
const machineSchema = z.object({
  name: z.string().min(1, "Machine name is required"),
  description: z.string().optional().nullable(),
  cellId: z.string().uuid("Invalid cell ID"),
  machineType: z.string().optional().nullable(),
  status: z.enum(["idle", "running", "down", "maintenance"]).default("idle"),
  standardCycleTime: z.number().min(0).default(0)
})

type MachineInput = z.infer<typeof machineSchema>

// Create a new machine
export async function createMachineAction(data: MachineInput): Promise<ActionState<SelectMachine>> {
  try {
    // Validate input
    const validatedData = machineSchema.parse(data)
    
    // Insert machine into database with standardCycleTime converted to string
    const [newMachine] = await db.insert(machinesTable).values({
      name: validatedData.name,
      description: validatedData.description,
      cellId: validatedData.cellId,
      machineType: validatedData.machineType,
      status: validatedData.status,
      standardCycleTime: validatedData.standardCycleTime.toString()
    }).returning()
    
    return {
      isSuccess: true,
      message: "Machine created successfully",
      data: newMachine
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid machine data"
      }
    }
    
    console.error("Error creating machine:", error)
    return {
      isSuccess: false,
      message: "Failed to create machine"
    }
  }
}

// Get all machines
export async function getMachinesAction(): Promise<ActionState<SelectMachine[]>> {
  try {
    const machines = await db
      .select()
      .from(machinesTable)
      .orderBy(machinesTable.name)
    
    return {
      isSuccess: true,
      message: "Machines retrieved successfully",
      data: machines
    }
  } catch (error) {
    console.error("Error getting machines:", error)
    return {
      isSuccess: false,
      message: "Failed to get machines"
    }
  }
}

// Get machines by cell ID
export async function getMachinesByCellIdAction(cellId: string): Promise<ActionState<SelectMachine[]>> {
  try {
    const machines = await db
      .select()
      .from(machinesTable)
      .where(eq(machinesTable.cellId, cellId))
      .orderBy(machinesTable.name)
    
    return {
      isSuccess: true,
      message: "Machines retrieved successfully",
      data: machines
    }
  } catch (error) {
    console.error("Error getting machines:", error)
    return {
      isSuccess: false,
      message: "Failed to get machines"
    }
  }
}

// Get a machine by ID
export async function getMachineByIdAction(machineId: string): Promise<ActionState<any>> {
  try {
    const machine = await db.query.machines.findFirst({
      where: eq(machinesTable.id, machineId),
      with: {
        cell: {
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
        }
      }
    })
    
    if (!machine) {
      return {
        isSuccess: false,
        message: "Machine not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Machine retrieved successfully",
      data: machine
    }
  } catch (error) {
    console.error("Error getting machine:", error)
    return {
      isSuccess: false,
      message: "Failed to get machine"
    }
  }
}

// Update a machine
export async function updateMachineAction(machineId: string, data: Partial<MachineInput>): Promise<ActionState<SelectMachine>> {
  try {
    // Validate input
    const validatedData = machineSchema.partial().parse(data)
    
    // Prepare update data
    const updateData: Record<string, any> = {
      ...validatedData,
      updatedAt: new Date()
    }
    
    // Convert standardCycleTime to string if it exists
    if (typeof updateData.standardCycleTime === 'number') {
      updateData.standardCycleTime = updateData.standardCycleTime.toString()
    }
    
    // Update machine in database
    const [updatedMachine] = await db
      .update(machinesTable)
      .set(updateData)
      .where(eq(machinesTable.id, machineId))
      .returning()
    
    if (!updatedMachine) {
      return {
        isSuccess: false,
        message: "Machine not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Machine updated successfully",
      data: updatedMachine
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid machine data"
      }
    }
    
    console.error("Error updating machine:", error)
    return {
      isSuccess: false,
      message: "Failed to update machine"
    }
  }
}

// Update multiple machines' cell ID
export async function updateMachinesCellAction(
  machineIds: string[],
  cellId: string
): Promise<ActionState<SelectMachine[]>> {
  try {
    // Validate cell ID
    if (!cellId || !z.string().uuid("Invalid cell ID").safeParse(cellId).success) {
      return {
        isSuccess: false,
        message: "Invalid cell ID"
      }
    }

    // Validate machine IDs
    if (!machineIds || machineIds.length === 0) {
      return {
        isSuccess: false,
        message: "No machines selected"
      }
    }

    // Check if all machine IDs are valid UUIDs
    for (const id of machineIds) {
      if (!z.string().uuid("Invalid machine ID").safeParse(id).success) {
        return {
          isSuccess: false,
          message: `Invalid machine ID: ${id}`
        }
      }
    }
    
    // Update machines in database
    const updatedMachines = await db
      .update(machinesTable)
      .set({
        cellId: cellId,
        updatedAt: new Date()
      })
      .where(inArray(machinesTable.id, machineIds))
      .returning()
    
    if (!updatedMachines || updatedMachines.length === 0) {
      return {
        isSuccess: false,
        message: "No machines were updated"
      }
    }
    
    return {
      isSuccess: true,
      message: `${updatedMachines.length} machines updated successfully`,
      data: updatedMachines
    }
  } catch (error) {
    console.error("Error updating machines:", error)
    return {
      isSuccess: false,
      message: "Failed to update machines"
    }
  }
}

// Delete a machine
export async function deleteMachineAction(machineId: string): Promise<ActionState<void>> {
  try {
    await db.delete(machinesTable).where(eq(machinesTable.id, machineId))
    
    return {
      isSuccess: true,
      message: "Machine deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting machine:", error)
    return {
      isSuccess: false,
      message: "Failed to delete machine"
    }
  }
} 