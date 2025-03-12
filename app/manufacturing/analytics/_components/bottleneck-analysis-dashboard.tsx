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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { format, parseISO } from "date-fns"
import { SelectBottleneckAnalysis } from "@/db/schema"
import { AlertTriangle } from "lucide-react"
import { createBottleneckAnalysisAction } from "@/actions/db/bottleneck-analysis-actions"
import { toast } from "sonner"

interface BottleneckAnalysisDashboardProps {
  bottlenecks: SelectBottleneckAnalysis[]
  cellId: string
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function BottleneckAnalysisDashboard({
  bottlenecks,
  cellId
}: BottleneckAnalysisDashboardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formValues, setFormValues] = useState({
    machineId: "",
    severity: "",
    notes: ""
  })

  // Format data for chart
  const machineBottlenecks = bottlenecks.reduce(
    (acc: Record<string, number>, bottleneck) => {
      const machineId = bottleneck.bottleneckMachineId || "unknown"
      const severity =
        typeof bottleneck.bottleneckSeverity === "number"
          ? bottleneck.bottleneckSeverity
          : bottleneck.bottleneckSeverity
            ? parseFloat(bottleneck.bottleneckSeverity.toString())
            : 0

      if (!acc[machineId]) {
        acc[machineId] = 0
      }
      acc[machineId] += 1
      return acc
    },
    {}
  )

  const chartData = Object.entries(machineBottlenecks).map(
    ([machineId, count]) => ({
      name: `Machine ${machineId.slice(-2)}`,
      value: count
    })
  )

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const today = new Date()
      const result = await createBottleneckAnalysisAction({
        cellId,
        date: format(today, "yyyy-MM-dd"),
        bottleneckMachineId: formValues.machineId,
        bottleneckSeverity: formValues.severity,
        notes: formValues.notes
      })

      if (result.isSuccess) {
        toast.success("Bottleneck analysis saved")
        setDialogOpen(false)
        setFormValues({
          machineId: "",
          severity: "",
          notes: ""
        })

        // Would refresh the data here
      } else {
        toast.error(result.message || "Failed to save analysis")
      }
    } catch (error) {
      toast.error("An error occurred")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-medium">Bottleneck Analysis</h3>
          <p className="text-muted-foreground text-sm">
            {bottlenecks.length > 0
              ? `Showing ${bottlenecks.length} bottleneck records`
              : "No bottleneck data available"}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Add Manual Analysis</Button>
      </div>

      {bottlenecks.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed p-8 text-center">
          <div className="max-w-md">
            <AlertTriangle className="mx-auto mb-4 size-10 text-amber-500" />
            <h3 className="mb-2 text-lg font-medium">
              No bottleneck data available
            </h3>
            <p className="text-muted-foreground text-sm">
              Bottleneck analysis is performed based on production data and
              machine cycle times. You can also add manual analysis by clicking
              the button above.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={value => `${value} occurrences`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bottlenecks.map(bottleneck => (
                  <TableRow key={bottleneck.id}>
                    <TableCell>
                      {format(parseISO(bottleneck.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {bottleneck.bottleneckMachineId
                        ? `Machine ${bottleneck.bottleneckMachineId.slice(-2)}`
                        : "Unknown"}
                    </TableCell>
                    <TableCell>
                      {bottleneck.bottleneckSeverity
                        ? (() => {
                            // Convert the severity to a number and format it
                            const severity =
                              typeof bottleneck.bottleneckSeverity === "number"
                                ? bottleneck.bottleneckSeverity
                                : parseFloat(
                                    String(bottleneck.bottleneckSeverity || "0")
                                  )
                            return `${severity.toFixed(1)}%`
                          })()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {bottleneck.notes || "No notes"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add Bottleneck Analysis</DialogTitle>
              <DialogDescription>
                Manually record a bottleneck in the production process
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <label
                  htmlFor="machine-id"
                  className="mb-1 block text-sm font-medium"
                >
                  Machine ID
                </label>
                <Input
                  id="machine-id"
                  placeholder="Enter machine ID"
                  value={formValues.machineId}
                  onChange={e =>
                    setFormValues({ ...formValues, machineId: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="severity"
                  className="mb-1 block text-sm font-medium"
                >
                  Severity (%)
                </label>
                <Input
                  id="severity"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Enter severity percentage"
                  value={formValues.severity}
                  onChange={e =>
                    setFormValues({ ...formValues, severity: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="notes"
                  className="mb-1 block text-sm font-medium"
                >
                  Notes
                </label>
                <Textarea
                  id="notes"
                  placeholder="Enter analysis notes"
                  value={formValues.notes}
                  onChange={e =>
                    setFormValues({ ...formValues, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Analysis"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
