"use server"

import { db } from "@/db/db"
import { InsertShift, SelectShift, shiftsTable } from "@/db/schema"
import { ActionState } from "@/types"
import { eq, and } from "drizzle-orm"

export async function startShiftAction(
  data: InsertShift
): Promise<ActionState<SelectShift>> {
  try {
    // Create a new shift record
    const [shift] = await db.insert(shiftsTable).values(data).returning()
    
    return {
      isSuccess: true,
      message: "Shift started successfully",
      data: shift
    }
  } catch (error) {
    console.error("Error starting shift:", error)
    return { 
      isSuccess: false, 
      message: "Failed to start shift" 
    }
  }
}

export async function updateShiftAction(
  id: string, 
  data: Partial<InsertShift>
): Promise<ActionState<SelectShift>> {
  try {
    const [updatedShift] = await db
      .update(shiftsTable)
      .set(data)
      .where(eq(shiftsTable.id, id))
      .returning()
    
    return {
      isSuccess: true,
      message: "Shift updated successfully",
      data: updatedShift
    }
  } catch (error) {
    console.error("Error updating shift:", error)
    return { 
      isSuccess: false, 
      message: "Failed to update shift" 
    }
  }
}

export async function endShiftAction(
  id: string,
  endData: {
    endTime: Date,
    duration: number,
    attainmentPercentage: number,
    totalLossMinutes: number,
    totalBreakMinutes: number,
    productionData?: string
  }
): Promise<ActionState<SelectShift>> {
  try {
    const [endedShift] = await db
      .update(shiftsTable)
      .set({
        endTime: endData.endTime,
        duration: endData.duration,
        attainmentPercentage: endData.attainmentPercentage.toString(),
        totalLossMinutes: endData.totalLossMinutes,
        totalBreakMinutes: endData.totalBreakMinutes,
        productionData: endData.productionData,
        completed: true
      })
      .where(eq(shiftsTable.id, id))
      .returning()
    
    return {
      isSuccess: true,
      message: "Shift ended successfully",
      data: endedShift
    }
  } catch (error) {
    console.error("Error ending shift:", error)
    return { 
      isSuccess: false, 
      message: "Failed to end shift" 
    }
  }
}

export async function getActiveShiftByUserIdAction(
  userId: string
): Promise<ActionState<SelectShift | null>> {
  try {
    const activeShifts = await db
      .select()
      .from(shiftsTable)
      .where(
        and(
          eq(shiftsTable.userId, userId),
          eq(shiftsTable.completed, false)
        )
      )
      .limit(1)
    
    return {
      isSuccess: true,
      message: "Active shift retrieved successfully",
      data: activeShifts.length > 0 ? activeShifts[0] : null
    }
  } catch (error) {
    console.error("Error retrieving active shift:", error)
    return { 
      isSuccess: false, 
      message: "Failed to retrieve active shift" 
    }
  }
}

export async function getShiftByIdAction(
  id: string
): Promise<ActionState<SelectShift | undefined>> {
  try {
    const shifts = await db
      .select()
      .from(shiftsTable)
      .where(eq(shiftsTable.id, id))
      .limit(1)
    
    if (shifts.length === 0) {
      return {
        isSuccess: false,
        message: "Shift not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Shift retrieved successfully",
      data: shifts[0]
    }
  } catch (error) {
    console.error("Error retrieving shift:", error)
    return { 
      isSuccess: false, 
      message: "Failed to retrieve shift" 
    }
  }
}

export async function getUserShiftsAction(
  userId: string,
  limit: number = 10
): Promise<ActionState<SelectShift[]>> {
  try {
    const shifts = await db
      .select()
      .from(shiftsTable)
      .where(eq(shiftsTable.userId, userId))
      .orderBy(shiftsTable.startTime)
      .limit(limit)
    
    return {
      isSuccess: true,
      message: "User shifts retrieved successfully",
      data: shifts
    }
  } catch (error) {
    console.error("Error retrieving user shifts:", error)
    return { 
      isSuccess: false, 
      message: "Failed to retrieve user shifts" 
    }
  }
}

export async function updateShiftProductionDataAction(
  shiftId: string,
  productionData: string
): Promise<ActionState<void>> {
  try {
    if (!shiftId) {
      return { isSuccess: false, message: "Shift ID is required" }
    }

    // Only update the productionData field, leaving the shift active
    await db
      .update(shiftsTable)
      .set({ productionData })
      .where(eq(shiftsTable.id, shiftId))

    return {
      isSuccess: true,
      message: "Shift production data updated successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error updating shift production data:", error)
    return { isSuccess: false, message: "Failed to update shift production data" }
  }
} 