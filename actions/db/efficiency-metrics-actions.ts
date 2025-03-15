"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq, and, sql, desc, between, isNull, not, gte, lte, asc } from "drizzle-orm"
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

/**
 * Get efficiency metrics for a specific cell within a date range
 * This function accepts either:
 * 1. Direct parameters: (cellId, startDate, endDate)
 * 2. Object format: ({ cellId, startDate, endDate })
 */
export async function getEfficiencyMetricsAction(
  cellIdOrOptions: string | { cellId: string; startDate: string; endDate: string },
  startDateParam?: string | Date,
  endDateParam?: string | Date
): Promise<ActionState<SelectEfficiencyMetric[]>> {
  try {
    // Handle both parameter formats
    let cellId: string;
    let startDate: string | Date;
    let endDate: string | Date;

    // Check if the first parameter is an object (legacy format)
    if (typeof cellIdOrOptions === 'object' && cellIdOrOptions !== null) {
      cellId = cellIdOrOptions.cellId;
      startDate = cellIdOrOptions.startDate;
      endDate = cellIdOrOptions.endDate;
    } else {
      // Direct parameters
      cellId = cellIdOrOptions as string;
      startDate = startDateParam as string | Date;
      endDate = endDateParam as string | Date;
    }

    // Validate inputs
    if (!cellId) {
      return {
        isSuccess: false,
        message: "Missing required parameter: cellId"
      };
    }

    // Clean input data to prevent SQL injection (with type safety)
    const cleanCellId = typeof cellId === 'string' ? cellId.trim() : cellId;
    
    // Set the time components of the dates to ensure full day coverage
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    console.log(`Querying efficiency metrics for cell ${cleanCellId}`);
    console.log(`Date range: ${start.toLocaleString()} to ${end.toLocaleString()}`);
    
    // Special check for March 13-14 data
    const isMarch13or14 = (start.getMonth() === 2 && (start.getDate() === 13 || start.getDate() === 14)) ||
                         (end.getMonth() === 2 && (end.getDate() === 13 || end.getDate() === 14)) ||
                         (start.getMonth() === 2 && start.getDate() <= 13 && end.getMonth() === 2 && end.getDate() >= 14);
    
    if (isMarch13or14) {
      console.log("📅 Special date range detected: Looking for March 13-14 efficiency metrics");
    }

    const metrics = await db.query.efficiencyMetrics.findMany({
      where: and(
        eq(efficiencyMetricsTable.cellId, cleanCellId),
        // Convert Date objects to ISO strings for database comparison
        gte(efficiencyMetricsTable.date, start.toISOString().split('T')[0]),
        lte(efficiencyMetricsTable.date, end.toISOString().split('T')[0])
      ),
      orderBy: [asc(efficiencyMetricsTable.date)]
    });
    
    console.log(`Found ${metrics.length} efficiency metrics for cell ${cleanCellId} between ${start.toLocaleString()} and ${end.toLocaleString()}`);

    // Special check for March 13-14 data
    if (isMarch13or14) {
      const specialDateMetrics = metrics.filter(metric => {
        const metricDate = new Date(metric.date).toISOString().split('T')[0];
        return metricDate === "2025-03-13" || metricDate === "2025-03-14";
      });
      
      if (specialDateMetrics.length > 0) {
        console.log(`Found ${specialDateMetrics.length} efficiency metrics for March 13-14`);
        console.log("First March 13-14 metric:", specialDateMetrics[0]);
      } else {
        console.log("No efficiency metrics found for March 13-14");
      }
    }

    return {
      isSuccess: true,
      message: "Efficiency metrics retrieved successfully",
      data: metrics
    };
  } catch (error) {
    console.error("Error retrieving efficiency metrics:", error);
    return {
      isSuccess: false,
      message: "Failed to retrieve efficiency metrics"
    };
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
    // Use Drizzle's query builder instead of raw SQL to avoid parameter binding issues
    const startOfDay = new Date(dateOnly);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dateOnly);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Use type-safe query instead of raw SQL
    const productionLogs = await db
      .select()
      .from(productionLogsTable)
      .where(
        and(
          eq(productionLogsTable.machineId, cellId),
          gte(productionLogsTable.createdAt, startOfDay),
          lte(productionLogsTable.createdAt, endOfDay),
          not(isNull(productionLogsTable.endTime))
        )
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

    // Process each log to extract metrics with proper field access
    for (const log of productionLogs) {
      partsProduced += Number(log.partsProduced || 0);
      totalRuntime += Number(log.actualCycleTime || 0);
      
      // First check if targetCount is directly available in the log
      let logTargetCount = 0;
      
      // Check for targetCount directly in the log record
      if (log.targetCount) {
        try {
          logTargetCount = Number(log.targetCount);
          console.log(`Found direct targetCount in log: ${logTargetCount}`);
        } catch (parseError) {
          console.warn(`Error parsing targetCount from log: ${log.targetCount}`, parseError);
        }
      }
      
      // If not found directly, extract from notes as fallback
      if (!logTargetCount) {
        // Extract production information from notes using robust regex patterns
        const targetQuantity = log.notes?.match(/target:(\d+)/)?.[1];
        
        if (targetQuantity) {
          try {
            logTargetCount = Number(targetQuantity);
            console.log(`Extracted targetCount from notes: ${logTargetCount}`);
          } catch (parseError) {
            console.warn(`Error parsing targetCount from notes: ${targetQuantity}`, parseError);
          }
        }
      }
      
      // If we still don't have a target, use parts produced as fallback
      if (!logTargetCount) {
        logTargetCount = Number(log.partsProduced || 0);
        console.log(`Using parts produced as fallback target: ${logTargetCount}`);
      }
      
      // Add to total target parts
      targetParts += logTargetCount;
      
      // Extract downtime minutes
      const downtimeMinutes = log.notes?.match(/downtime:(\d+)/)?.[1];
      
      // Enhanced error handling for extracted values
      try {
        // Convert downtimeMinutes to seconds if it exists
        if (downtimeMinutes) {
          totalDowntime += Number(downtimeMinutes) * 60;
        }
      } catch (extractionError) {
        console.warn("Error extracting downtime from notes:", extractionError, log.notes);
        // Continue processing other logs even if one has issues
      }
    }

    // Calculate efficiency
    const efficiencyValue = totalRuntime > 0 && (totalRuntime + totalDowntime) > 0
      ? (totalRuntime / (totalRuntime + totalDowntime)) * 100
      : 100; // Default to 100% if no data

    // Calculate attainment percentage with improved handling
    let attainmentValue: number | null = null;
    
    if (targetParts > 0) {
      // Following best practices for numerical calculations 
      attainmentValue = (partsProduced / targetParts) * 100;
      
      // Validate the calculated value is reasonable
      if (isNaN(attainmentValue) || !isFinite(attainmentValue)) {
        console.warn(`Invalid attainment value calculated: ${attainmentValue}. Using null instead.`);
        attainmentValue = null;
      } else if (attainmentValue > 200) {
        // Attainment over 200% likely indicates a data error, but we'll cap it rather than nullify
        console.warn(`Unusually high attainment detected: ${attainmentValue}%. Capping at 200%.`);
        attainmentValue = 200;
      }
    } else {
      console.warn("No target parts found in logs, cannot calculate attainment percentage");
    }
      
    // Convert to string values in a safe way
    let efficiencyString: string;
    let attainmentString: string | null = null;
    
    try {
      efficiencyString = String(Number(efficiencyValue.toFixed(2)));
      if (attainmentValue !== null) {
        attainmentString = String(Number(attainmentValue.toFixed(2)));
      }
    } catch (error) {
      console.warn("Error converting efficiency values to string:", error);
      efficiencyString = "100.00"; // Default value
    }

    if (existingMetrics) {
      // Update existing metrics - with proper type handling
      const [updatedMetric] = await db
        .update(efficiencyMetricsTable)
        .set({
          totalRuntime: totalRuntime,
          totalDowntime: totalDowntime,
          partsProduced: partsProduced,
          efficiency: efficiencyString,
          attainmentPercentage: attainmentString,
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
      // Create new metrics record - with proper type handling
      const newMetric = await db
        .insert(efficiencyMetricsTable)
        .values({
          date: dateOnly,
          cellId: cellId,
          valueStreamId: cell.valueStreamId,
          siteId: null,
          companyId: null,
          totalRuntime: totalRuntime,
          totalDowntime: totalDowntime,
          partsProduced: partsProduced,
          efficiency: efficiencyString,
          attainmentPercentage: attainmentString,
          targetCount: String(targetParts),
          actualCount: String(partsProduced),
          downtimeMinutes: String(Math.round(totalDowntime / 60))
        })
        .returning();

      return {
        isSuccess: true,
        message: "Efficiency metrics calculated and stored successfully",
        data: newMetric[0] // Access the first item from the array
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
      return sum + (isNaN(effValue) ? 0 : effValue);
    }, 0) / metrics.length;
    
    // Calculate average attainment percentage with improved handling
    // Only include valid attainment values (non-null, non-NaN)
    const validAttainmentMetrics = metrics.filter(m => {
      // Check if attainment is present
      if (m.attainmentPercentage === null) return false;
      
      // Convert to number if it's a string
      const attValue = typeof m.attainmentPercentage === 'string' 
        ? parseFloat(m.attainmentPercentage) 
        : m.attainmentPercentage;
        
      // Validate it's a valid number
      return !isNaN(attValue) && isFinite(attValue);
    });
    
    // Calculate average attainment if we have valid metrics
    const avgAttainment = validAttainmentMetrics.length > 0
      ? validAttainmentMetrics.reduce((sum, metric) => {
          const attValue = typeof metric.attainmentPercentage === 'string' 
            ? parseFloat(metric.attainmentPercentage) 
            : (metric.attainmentPercentage || 0);
          return sum + attValue;
        }, 0) / validAttainmentMetrics.length
      : null;
      
    // Log information about attainment calculation for debugging
    if (validAttainmentMetrics.length === 0) {
      console.warn(`No valid attainment metrics found for cell ${cellId}. Check if target values are being correctly saved.`);
    } else {
      console.log(`Calculated avgAttainment ${avgAttainment}% from ${validAttainmentMetrics.length} valid metrics out of ${metrics.length} total.`);
    }

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

// Recalculate attainment percentages for historical data
export async function recalculateAttainmentAction(
  cellId: string,
  dateRange?: {startDate: string, endDate: string}
): Promise<ActionState<{updated: number}>> {
  try {
    // Validate inputs
    if (!cellId) {
      return {
        isSuccess: false,
        message: "Missing required parameter: cellId"
      }
    }
    
    // Build the where conditions for the query
    const whereConditions = [eq(efficiencyMetricsTable.cellId, cellId)];
    
    // Add date range if provided
    if (dateRange) {
      const { startDate, endDate } = dateRange;
      whereConditions.push(
        between(
          efficiencyMetricsTable.date,
          startDate,
          endDate
        )
      );
    }
    
    // Include only metrics with null attainment
    whereConditions.push(isNull(efficiencyMetricsTable.attainmentPercentage));
    
    // Find metrics without attainment percentages
    const metricsToUpdate = await db.query.efficiencyMetrics.findMany({
      where: and(...whereConditions)
    });
    
    console.log(`Found ${metricsToUpdate.length} metrics with missing attainment values for cell ${cellId}`);
    
    if (metricsToUpdate.length === 0) {
      return {
        isSuccess: true,
        message: "No missing attainment values found to update",
        data: { updated: 0 }
      }
    }
    
    // Process each metric to calculate attainment
    let updatedCount = 0;
    
    for (const metric of metricsToUpdate) {
      // Extract actual and target values
      let actualCount = 0;
      let targetCount = 0;
      
      // Parse from stored strings with fallbacks
      try {
        actualCount = metric.actualCount ? parseInt(metric.actualCount) : metric.partsProduced;
        
        // If targetCount is available, use it
        if (metric.targetCount) {
          targetCount = parseInt(metric.targetCount);
        } 
        // Otherwise, use actual as target (100% attainment) as fallback
        else {
          targetCount = actualCount;
        }
      } catch (parseError) {
        console.warn(`Error parsing counts for metric ${metric.id}:`, parseError);
        continue; // Skip this metric
      }
      
      // Calculate attainment percentage
      let attainmentValue: number | null = null;
      
      if (targetCount > 0 && actualCount > 0) {
        attainmentValue = (actualCount / targetCount) * 100;
        
        // Validate the calculated value
        if (isNaN(attainmentValue) || !isFinite(attainmentValue)) {
          console.warn(`Invalid attainment value calculated for metric ${metric.id}: ${attainmentValue}`);
          continue; // Skip this metric
        }
        
        // Cap unreasonable values (likely data errors)
        if (attainmentValue > 200) {
          console.warn(`Unusually high attainment detected for metric ${metric.id}: ${attainmentValue}%. Capping at 200%.`);
          attainmentValue = 200;
        }
        
        // Convert to string for storage
        const attainmentString = String(Number(attainmentValue.toFixed(2)));
        
        // Update the record in the database
        try {
          await db
            .update(efficiencyMetricsTable)
            .set({
              attainmentPercentage: attainmentString,
              updatedAt: new Date()
            })
            .where(eq(efficiencyMetricsTable.id, metric.id));
          
          updatedCount++;
        } catch (updateError) {
          console.error(`Error updating attainment for metric ${metric.id}:`, updateError);
        }
      }
    }
    
    return {
      isSuccess: true,
      message: `Updated attainment values for ${updatedCount} metrics`,
      data: { updated: updatedCount }
    }
  } catch (error) {
    console.error("Error recalculating attainment percentages:", error);
    return {
      isSuccess: false,
      message: "An error occurred while recalculating attainment percentages"
    }
  }
} 