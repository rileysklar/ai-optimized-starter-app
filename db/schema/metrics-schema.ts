/*
<ai_context>
Defines the database schema for metrics-related entities.
Includes efficiency metrics and bottleneck analysis.
</ai_context>
*/

import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  decimal,
  date
} from "drizzle-orm/pg-core"
import {
  companiesTable,
  sitesTable,
  valueStreamsTable,
  cellsTable
} from "./manufacturing-schema"
import { machinesTable } from "./production-schema"

// Efficiency Metrics table (daily aggregates)
export const efficiencyMetricsTable = pgTable("efficiency_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").notNull(),

  // Hierarchy references - only one should be populated per record
  machineId: uuid("machine_id").references(() => machinesTable.id, {
    onDelete: "cascade"
  }),
  cellId: uuid("cell_id").references(() => cellsTable.id, {
    onDelete: "cascade"
  }),
  valueStreamId: uuid("value_stream_id").references(
    () => valueStreamsTable.id,
    { onDelete: "cascade" }
  ),
  siteId: uuid("site_id").references(() => sitesTable.id, {
    onDelete: "cascade"
  }),
  companyId: uuid("company_id").references(() => companiesTable.id, {
    onDelete: "cascade"
  }),

  // Metrics data
  totalRuntime: integer("total_runtime").notNull(), // in seconds
  totalDowntime: integer("total_downtime").notNull(), // in seconds
  partsProduced: integer("parts_produced").notNull(),
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }).notNull(), // stored as percentage

  // Standard timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Bottleneck Analysis table
export const bottleneckAnalysisTable = pgTable("bottleneck_analysis", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").notNull(),
  cellId: uuid("cell_id")
    .references(() => cellsTable.id, { onDelete: "cascade" })
    .notNull(),
  bottleneckMachineId: uuid("bottleneck_machine_id").references(
    () => machinesTable.id,
    { onDelete: "set null" }
  ),
  bottleneckSeverity: decimal("bottleneck_severity", {
    precision: 5,
    scale: 2
  }), // percentage impact on throughput
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Export types for each table
export type InsertEfficiencyMetric = typeof efficiencyMetricsTable.$inferInsert
export type SelectEfficiencyMetric = typeof efficiencyMetricsTable.$inferSelect

export type InsertBottleneckAnalysis =
  typeof bottleneckAnalysisTable.$inferInsert
export type SelectBottleneckAnalysis =
  typeof bottleneckAnalysisTable.$inferSelect
