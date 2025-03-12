"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from "recharts"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { SelectEfficiencyMetric } from "@/db/schema"

interface ProductionTrendsChartProps {
  data: SelectEfficiencyMetric[]
  showDetails?: boolean
  productionLogs?: any[]
}

export function ProductionTrendsChart({
  data,
  showDetails = false,
  productionLogs = []
}: ProductionTrendsChartProps) {
  // If no data, show empty state
  if (data.length === 0) {
    return (
      <div className="flex size-full items-center justify-center rounded-md border border-dashed">
        <div className="text-center">
          <p className="text-muted-foreground">No data available</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Generate metrics to see production trends
          </p>
        </div>
      </div>
    )
  }

  // Format data for chart
  const chartData = data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(metric => {
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
        fullDate: metric.date,
        efficiency: efficiencyValue,
        attainment: attainmentValue,
        partsProduced: metric.partsProduced,
        runtime: Math.round(metric.totalRuntime / 60), // Convert seconds to minutes
        downtime: Math.round(metric.totalDowntime / 60) // Convert seconds to minutes
      }
    })

  // If detailed view, use the composed chart with more metrics
  if (showDetails) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            yAxisId="left"
            orientation="left"
            domain={[0, (max: number) => Math.max(100, max)]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, (max: number) => Math.max(100, max)]}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background rounded-lg border p-2 shadow-md">
                    <p className="font-medium">{label}</p>
                    <div className="mt-1 space-y-0.5">
                      {payload.map((entry, index) => {
                        // Safe access to entry name
                        const name = entry.name?.toString() || ""

                        // Determine suffix based on the metric
                        let suffix = ""
                        if (
                          name.includes("Efficiency") ||
                          name.includes("Attainment")
                        ) {
                          suffix = "%"
                        } else if (name.includes("Parts")) {
                          suffix = "units"
                        } else {
                          suffix = "min"
                        }

                        return (
                          <p
                            key={`item-${index}`}
                            className="text-sm"
                            style={{ color: entry.color }}
                          >
                            {`${name}: ${entry.value} ${suffix}`}
                          </p>
                        )
                      })}
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
          <Bar
            yAxisId="right"
            dataKey="partsProduced"
            name="Parts Produced"
            barSize={20}
            fill="#a855f7"
          />
          <Bar
            yAxisId="right"
            dataKey="downtime"
            name="Downtime (min)"
            barSize={20}
            fill="#ef4444"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="efficiency"
            name="Efficiency %"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="attainment"
            name="Attainment %"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    )
  }

  // Otherwise use the simpler line chart
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
        <Legend />
        <Line
          type="monotone"
          dataKey="efficiency"
          name="Efficiency %"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="attainment"
          name="Attainment %"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
