/*
<ai_context>
Defines the database schema for production-related entities.
Includes machines, production logs, and downtime logs.
</ai_context>
*/

import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  decimal
} from "drizzle-orm/pg-core"
import { profilesTable } from "./profiles-schema"
import { cellsTable } from "./manufacturing-schema"

// Define status and reason enums
export const machineStatusEnum = pgEnum("machine_status", [
  "idle",
  "running",
  "down",
  "maintenance"
])
export const downtimeReasonEnum = pgEnum("downtime_reason", [
  "setup",
  "breakdown",
  "material_shortage",
  "quality_issue",
  "changeover",
  "scheduled_maintenance",
  "other"
])

// Machines table
export const machinesTable = pgTable("machines", {
  id: uuid("id").defaultRandom().primaryKey(),
  cellId: uuid("cell_id")
    .references(() => cellsTable.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: machineStatusEnum("status").default("idle").notNull(),
  standardCycleTime: integer("standard_cycle_time").notNull(), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Production Logs table
export const productionLogsTable = pgTable("production_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  machineId: uuid("machine_id")
    .references(() => machinesTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => profilesTable.userId)
    .notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  partsProduced: integer("parts_produced").default(0).notNull(),
  actualCycleTime: integer("actual_cycle_time"), // in seconds, calculated on completion
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }), // stored as percentage
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Downtime Logs table
export const downtimeLogsTable = pgTable("downtime_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  machineId: uuid("machine_id")
    .references(() => machinesTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => profilesTable.userId)
    .notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  reason: downtimeReasonEnum("reason").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Export types for each table
export type InsertMachine = typeof machinesTable.$inferInsert
export type SelectMachine = typeof machinesTable.$inferSelect

export type InsertProductionLog = typeof productionLogsTable.$inferInsert
export type SelectProductionLog = typeof productionLogsTable.$inferSelect

export type InsertDowntimeLog = typeof downtimeLogsTable.$inferInsert
export type SelectDowntimeLog = typeof downtimeLogsTable.$inferSelect
