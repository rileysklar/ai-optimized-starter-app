import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"
import { cellsTable } from "./manufacturing-schema"

export const shiftsTable = pgTable("shifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  cellId: uuid("cell_id").references(() => cellsTable.id),
  shiftType: text("shift_type").notNull(), // "1st", "2nd", "3rd"
  date: timestamp("date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  attainmentPercentage: numeric("attainment_percentage"),
  totalLossMinutes: integer("total_loss_minutes"),
  totalBreakMinutes: integer("total_break_minutes"),
  completed: boolean("completed").default(false),
  productionData: text("production_data"), // JSON string of production data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertShift = typeof shiftsTable.$inferInsert
export type SelectShift = typeof shiftsTable.$inferSelect
