import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const partsTable = pgTable("parts", {
  id: uuid("id").defaultRandom().primaryKey(),
  partNumber: text("part_number").notNull(),
  description: text("description").notNull(),
  cycleTimeMachine1: integer("cycle_time_machine1").notNull(),
  cycleTimeMachine2: integer("cycle_time_machine2").notNull(),
  cycleTimeMachine3: integer("cycle_time_machine3").notNull(),
  cycleTimeMachine4: integer("cycle_time_machine4").notNull(),
  bottleneckMachine: integer("bottleneck_machine").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertPart = typeof partsTable.$inferInsert
export type SelectPart = typeof partsTable.$inferSelect
