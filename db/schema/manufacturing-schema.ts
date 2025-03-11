/*
<ai_context>
Defines the database schema for manufacturing hierarchy entities.
Includes companies, sites, value streams, cells, and user assignments.
</ai_context>
*/

import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  numeric
} from "drizzle-orm/pg-core"
import { profilesTable, userRoleEnum } from "./profiles-schema"

// Companies table
export const companiesTable = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Sites table
export const sitesTable = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .references(() => companiesTable.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Value Streams table
export const valueStreamsTable = pgTable("value_streams", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id")
    .references(() => sitesTable.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Cells table
export const cellsTable = pgTable("cells", {
  id: uuid("id").defaultRandom().primaryKey(),
  valueStreamId: uuid("value_stream_id")
    .references(() => valueStreamsTable.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Machines table
export const machinesTable = pgTable("machines", {
  id: uuid("id").defaultRandom().primaryKey(),
  cellId: uuid("cell_id")
    .references(() => cellsTable.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  machineType: text("machine_type"),
  status: text("status", { enum: ["idle", "running", "down", "maintenance"] })
    .default("idle")
    .notNull(),
  standardCycleTime: numeric("standard_cycle_time").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// User Assignments table - links users to hierarchy
export const userAssignmentsTable = pgTable("user_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => profilesTable.userId, { onDelete: "cascade" })
    .notNull(),
  companyId: uuid("company_id")
    .references(() => companiesTable.id)
    .notNull(),
  siteId: uuid("site_id")
    .references(() => sitesTable.id)
    .notNull(),
  valueStreamId: uuid("value_stream_id").references(() => valueStreamsTable.id),
  cellId: uuid("cell_id").references(() => cellsTable.id),
  isPrimary: boolean("is_primary").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Export types for each table
export type InsertCompany = typeof companiesTable.$inferInsert
export type SelectCompany = typeof companiesTable.$inferSelect

export type InsertSite = typeof sitesTable.$inferInsert
export type SelectSite = typeof sitesTable.$inferSelect

export type InsertValueStream = typeof valueStreamsTable.$inferInsert
export type SelectValueStream = typeof valueStreamsTable.$inferSelect

export type InsertCell = typeof cellsTable.$inferInsert
export type SelectCell = typeof cellsTable.$inferSelect

export type InsertUserAssignment = typeof userAssignmentsTable.$inferInsert
export type SelectUserAssignment = typeof userAssignmentsTable.$inferSelect

export type InsertMachine = typeof machinesTable.$inferInsert
export type SelectMachine = typeof machinesTable.$inferSelect
