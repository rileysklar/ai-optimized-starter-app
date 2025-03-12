"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { format, parseISO } from "date-fns"
import { SelectEfficiencyMetric } from "@/db/schema"
import { cn } from "@/lib/utils"

interface EfficiencyDashboardProps {
  metrics: SelectEfficiencyMetric[]
  cellId: string
  cellName: string
}

export function EfficiencyDashboard({
  metrics,
  cellId,
  cellName
}: EfficiencyDashboardProps) {
  const [view, setView] = useState<"chart" | "table">("chart")

  // Format data for chart
  const chartData = metrics.map(metric => {
    // Handle both string and number types for efficiency and attainment
    const efficiencyValue =
      typeof metric.efficiency === "number"
        ? metric.efficiency
        : parseFloat(metric.efficiency as string)

    const attainmentValue =
      metric.attainmentPercentage !== null
        ? typeof metric.attainmentPercentage === "number"
          ? metric.attainmentPercentage
          : parseFloat(metric.attainmentPercentage as string)
        : null

    return {
      date: format(parseISO(metric.date), "MMM dd"),
      efficiency: efficiencyValue,
      attainment: attainmentValue,
      partsProduced: metric.partsProduced,
      downtime: Math.round(metric.totalDowntime / 60) // Convert seconds to minutes
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-medium">{cellName} Efficiency</h3>
          <p className="text-muted-foreground text-sm">
            Showing {metrics.length} days of efficiency data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={cn(
              "rounded-md px-3 py-1 text-sm",
              view === "chart"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary"
            )}
            onClick={() => setView("chart")}
          >
            Chart
          </button>
          <button
            className={cn(
              "rounded-md px-3 py-1 text-sm",
              view === "table"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary"
            )}
            onClick={() => setView("table")}
          >
            Table
          </button>
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed p-8 text-center">
          <div>
            <p className="text-muted-foreground">
              No efficiency data available
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Use the metrics calculator to generate efficiency data
            </p>
          </div>
        </div>
      ) : view === "chart" ? (
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, (max: number) => Math.max(max, 100)]}
              />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="efficiency"
                name="Efficiency %"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="attainment"
                name="Attainment %"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="partsProduced"
                name="Parts Produced"
                fill="#a855f7"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Parts</TableHead>
                <TableHead className="text-right">Runtime (min)</TableHead>
                <TableHead className="text-right">Downtime (min)</TableHead>
                <TableHead className="text-right">Efficiency</TableHead>
                <TableHead className="text-right">Attainment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map(metric => {
                // Handle both string and number types for efficiency and attainment
                const efficiencyValue =
                  typeof metric.efficiency === "number"
                    ? metric.efficiency
                    : parseFloat(metric.efficiency as string)

                const attainmentValue =
                  metric.attainmentPercentage !== null
                    ? typeof metric.attainmentPercentage === "number"
                      ? metric.attainmentPercentage
                      : parseFloat(metric.attainmentPercentage as string)
                    : null

                return (
                  <TableRow key={metric.id}>
                    <TableCell>
                      {format(parseISO(metric.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {metric.partsProduced}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(metric.totalRuntime / 60)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(metric.totalDowntime / 60)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        efficiencyValue < 85
                          ? "text-red-600"
                          : efficiencyValue >= 100
                            ? "text-green-600"
                            : ""
                      )}
                    >
                      {efficiencyValue.toFixed(1)}%
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        attainmentValue && attainmentValue < 85
                          ? "text-red-600"
                          : attainmentValue && attainmentValue >= 100
                            ? "text-green-600"
                            : ""
                      )}
                    >
                      {attainmentValue
                        ? `${attainmentValue.toFixed(1)}%`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
