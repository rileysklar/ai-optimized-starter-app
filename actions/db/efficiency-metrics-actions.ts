"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq, and, sql, desc, between, isNull, not } from "drizzle-orm"
import { 
  productionMachinesTable as machinesTable,
  productionLogsTable,
  downtimeLogsTable,
  cellsTable,
  efficiencyMetricsTable
} from "@/db/schema"
import { 
  SelectEfficiencyMetric,
  InsertEfficiencyMetric
} from "@/db/schema/metrics-schema"
import { SelectMachine } from "@/db/schema/production-schema"
import { SelectProductionLog, SelectDowntimeLog } from "@/db/schema/production-schema"
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, addDays, isValid, parse } from "date-fns"

// Validation schema for calculating efficiency metrics
const calculateEfficiencySchema = z.object({
  cellId: z.string().uuid("Invalid cell ID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in format YYYY-MM-DD")
})

type CalculateEfficiencyInput = z.infer<typeof calculateEfficiencySchema>

// Get efficiency metrics for a cell by date range
export async function getEfficiencyMetricsAction({
  cellId,
  startDate,
  endDate
}: {
  cellId: string
  startDate: string
  endDate: string
}): Promise<ActionState<SelectEfficiencyMetric[]>> {
  try {
    // Validate inputs
    if (!cellId || !startDate || !endDate) {
      return {
        isSuccess: false,
        message: "Missing required parameters: cellId, startDate, and endDate"
      }
    }

    // Parse the date strings to ensure correct format
    const parsedStartDate = startDate.includes("T") 
      ? new Date(startDate) 
      : parse(startDate, "yyyy-MM-dd", new Date())
    
    const parsedEndDate = endDate.includes("T")
      ? new Date(endDate)
      : parse(endDate, "yyyy-MM-dd", new Date())
    
    const startDateFormatted = format(parsedStartDate, "yyyy-MM-dd")
    const endDateFormatted = format(parsedEndDate, "yyyy-MM-dd")

    // Fetch metrics for the specified cell and date range
    const metrics = await db.query.efficiencyMetrics.findMany({
      where: and(
        eq(efficiencyMetricsTable.cellId, cellId),
        between(
          efficiencyMetricsTable.date,
          startDateFormatted,
          endDateFormatted
        )
      ),
      orderBy: [efficiencyMetricsTable.date]
    })

    return {
      isSuccess: true,
      message: "Efficiency metrics retrieved successfully",
      data: metrics
    }
  } catch (error) {
    console.error("Error retrieving efficiency metrics:", error)
    return {
      isSuccess: false,
      message: "An error occurred while retrieving efficiency metrics"
    }
  }
}

// Calculate efficiency metrics for a cell on a specific date
export async function calculateMachineEfficiencyAction(
  input: CalculateEfficiencyInput | { cellId: string; date: string }
): Promise<ActionState<SelectEfficiencyMetric>> {
  try {
    // Handle both input formats
    let cellId: string;
    let date: string;

    if ('cellId' in input && 'date' in input) {
      // New simplified format
      cellId = input.cellId;
      date = input.date;
    } else {
      // Use the validation schema to validate the input
      const validatedData = calculateEfficiencySchema.parse(input);
      cellId = validatedData.cellId;
      date = validatedData.date;
    }

    // Validate inputs
    if (!cellId || !date) {
      return {
        isSuccess: false,
        message: "Missing required parameters: cellId and date"
      }
    }

    // Parse the date string to ensure correct format
    const parsedDate = date.includes("T")
      ? new Date(date)
      : parse(date, "yyyy-MM-dd", new Date())
    
    const dateOnly = format(parsedDate, "yyyy-MM-dd")

    // First, check if data for this cell and date already exists
    const existingMetrics = await db.query.efficiencyMetrics.findFirst({
      where: and(
        eq(efficiencyMetricsTable.cellId, cellId),
        eq(efficiencyMetricsTable.date, dateOnly)
      )
    })

    // No existing metrics, calculate from production logs
    
    // First, get the cell details
    const cell = await db.query.cells.findFirst({
      where: eq(cellsTable.id, cellId),
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
    })

    if (!cell) {
      return {
        isSuccess: false,
        message: "Cell not found"
      }
    }

    // Next, get the production logs for this date and cell
    // Use SQL with proper column names
    const productionLogs = await db.execute(
      sql`SELECT * FROM production_logs 
          WHERE cell_id = ${cellId}
          AND DATE(date) = ${dateOnly}
          AND completed = true`
    );

    if (productionLogs.length === 0) {
      return {
        isSuccess: false,
        message: "No production logs found for this date. Cannot calculate metrics."
      }
    }

    // Calculate metrics from logs
    let totalRuntime = 0;
    let totalDowntime = 0;
    let partsProduced = 0;
    let targetParts = 0;

    // Process each log to extract metrics
    for (const log of productionLogs.rows as any[]) {
      partsProduced += Number(log.quantity || 0);
      totalRuntime += Number(log.actual_time || 0);
      totalDowntime += Number(log.downtime_minutes || 0) * 60; // Convert to seconds
      targetParts += Number(log.target_quantity || 0);
    }

    // Calculate efficiency
    const efficiencyValue = totalRuntime > 0 && (totalRuntime + totalDowntime) > 0
      ? (totalRuntime / (totalRuntime + totalDowntime)) * 100
      : 100; // Default to 100% if no data

    // Calculate attainment percentage
    const attainmentValue = targetParts > 0
      ? (partsProduced / targetParts) * 100
      : null;

    if (existingMetrics) {
      // Update existing metrics
      const [updatedMetric] = await db
        .update(efficiencyMetricsTable)
        .set({
          totalRuntime: totalRuntime,
          totalDowntime: totalDowntime,
          partsProduced: partsProduced,
          efficiency: Number(efficiencyValue.toFixed(2)),
          attainmentPercentage: attainmentValue ? Number(attainmentValue.toFixed(2)) : null,
          targetCount: String(targetParts),
          actualCount: String(partsProduced),
          downtimeMinutes: String(Math.round(totalDowntime / 60)),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(efficiencyMetricsTable.cellId, cellId),
            eq(efficiencyMetricsTable.date, dateOnly)
          )
        )
        .returning();

      return {
        isSuccess: true,
        message: "Efficiency metrics updated successfully",
        data: updatedMetric
      };
    } else {
      // Create new metrics record
      const [newMetric] = await db
        .insert(efficiencyMetricsTable)
        .values({
          date: dateOnly,
          cellId: cellId,
          valueStreamId: cell.valueStreamId || null,
          siteId: cell.valueStream?.siteId || null,
          companyId: cell.valueStream?.site?.companyId || null,
          totalRuntime: totalRuntime,
          totalDowntime: totalDowntime,
          partsProduced: partsProduced,
          efficiency: Number(efficiencyValue.toFixed(2)),
          attainmentPercentage: attainmentValue ? Number(attainmentValue.toFixed(2)) : null,
          targetCount: String(targetParts),
          actualCount: String(partsProduced),
          downtimeMinutes: String(Math.round(totalDowntime / 60))
        })
        .returning();

      return {
        isSuccess: true,
        message: "Efficiency metrics calculated and stored successfully",
        data: newMetric
      };
    }
  } catch (error) {
    console.error("Error calculating efficiency metrics:", error);
    return {
      isSuccess: false,
      message: "An error occurred while calculating efficiency metrics"
    };
  }
}

// Get aggregated efficiency metrics for a cell (for dashboard use)
export async function getAggregatedEfficiencyMetricsAction({
  cellId,
  period
}: {
  cellId: string
  period: "day" | "week" | "month"
}): Promise<ActionState<any>> {
  try {
    // Validate inputs
    if (!cellId || !period) {
      return {
        isSuccess: false,
        message: "Missing required parameters: cellId and period"
      }
    }

    // Calculate date range based on period
    const today = new Date()
    let startDate: Date
    
    switch (period) {
      case "day":
        startDate = today // Just today
        break
      case "week":
        // Start from 6 days ago (7 days total including today)
        startDate = new Date()
        startDate.setDate(today.getDate() - 6)
        break
      case "month":
        // Start from 29 days ago (30 days total including today)
        startDate = new Date()
        startDate.setDate(today.getDate() - 29)
        break
      default:
        startDate = today
    }
    
    const startDateFormatted = format(startDate, "yyyy-MM-dd")
    const todayFormatted = format(today, "yyyy-MM-dd")

    // Fetch and aggregate metrics
    const metrics = await db.query.efficiencyMetrics.findMany({
      where: and(
        eq(efficiencyMetricsTable.cellId, cellId),
        between(
          efficiencyMetricsTable.date,
          startDateFormatted,
          todayFormatted
        )
      )
    })

    if (metrics.length === 0) {
      return {
        isSuccess: false,
        message: "No metrics found for the specified cell and period"
      }
    }

    // Calculate aggregates
    const totalParts = metrics.reduce((sum, metric) => sum + metric.partsProduced, 0)
    const totalRuntime = metrics.reduce((sum, metric) => sum + metric.totalRuntime, 0)
    const totalDowntime = metrics.reduce((sum, metric) => sum + metric.totalDowntime, 0)
    
    // Calculate average efficiency - convert string to number if needed
    const avgEfficiency = metrics.reduce((sum, metric) => {
      const effValue = typeof metric.efficiency === 'string' 
        ? parseFloat(metric.efficiency) 
        : metric.efficiency;
      return sum + effValue;
    }, 0) / metrics.length;
    
    // Calculate average attainment percentage if available
    const attainmentMetrics = metrics.filter(m => m.attainmentPercentage !== null)
    const avgAttainment = attainmentMetrics.length > 0
      ? attainmentMetrics.reduce((sum, metric) => {
          const attValue = typeof metric.attainmentPercentage === 'string' 
            ? parseFloat(metric.attainmentPercentage) 
            : (metric.attainmentPercentage || 0);
          return sum + attValue;
        }, 0) / attainmentMetrics.length
      : null;

    return {
      isSuccess: true,
      message: "Aggregated efficiency metrics retrieved successfully",
      data: {
        period,
        totalParts,
        totalRuntime,
        totalDowntime,
        avgEfficiency,
        avgAttainment,
        metrics // Include individual metrics for charts
      }
    }
  } catch (error) {
    console.error("Error retrieving aggregated efficiency metrics:", error)
    return {
      isSuccess: false,
      message: "An error occurred while retrieving aggregated efficiency metrics"
    }
  }
} 