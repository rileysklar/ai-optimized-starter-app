import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { cellsTable } from "./manufacturing-schema"

export const setupTimesTable = pgTable("setup_times", {
  id: uuid("id").defaultRandom().primaryKey(),
  cellId: uuid("cell_id")
    .references(() => cellsTable.id, { onDelete: "cascade" })
    .notNull(),
  setupTimeMachine1: integer("setup_time_machine1").notNull(),
  setupTimeMachine2: integer("setup_time_machine2").notNull(),
  setupTimeMachine3: integer("setup_time_machine3").notNull(),
  setupTimeMachine4: integer("setup_time_machine4").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertSetupTimes = typeof setupTimesTable.$inferInsert
export type SelectSetupTimes = typeof setupTimesTable.$inferSelect
