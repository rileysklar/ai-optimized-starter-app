"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { bottleneckAnalysisTable } from "@/db/schema"
import { and, between, eq } from "drizzle-orm"

interface BottleneckAnalysisParams {
  cellId: string
  startDate: string
  endDate: string
}

export async function getBottleneckAnalysisAction(
  params: BottleneckAnalysisParams
): Promise<ActionState<any[]>> {
  try {
    const { cellId, startDate, endDate } = params
    
    const bottlenecks = await db
      .select()
      .from(bottleneckAnalysisTable)
      .where(
        and(
          eq(bottleneckAnalysisTable.cellId, cellId),
          between(bottleneckAnalysisTable.date, startDate, endDate)
        )
      )
      .orderBy(bottleneckAnalysisTable.date)
    
    return {
      isSuccess: true,
      message: "Bottleneck analysis retrieved successfully",
      data: bottlenecks
    }
  } catch (error) {
    console.error("Error retrieving bottleneck analysis:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve bottleneck analysis"
    }
  }
} 