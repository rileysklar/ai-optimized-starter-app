import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  foreignKey,
  numeric,
  date,
  boolean,
  pgEnum
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const downtimeReason = pgEnum("downtime_reason", [
  "setup",
  "breakdown",
  "material_shortage",
  "quality_issue",
  "changeover",
  "scheduled_maintenance",
  "other"
])
export const machineStatus = pgEnum("machine_status", [
  "idle",
  "running",
  "down",
  "maintenance"
])
export const membership = pgEnum("membership", ["free", "pro"])
export const userRole = pgEnum("user_role", ["admin", "supervisor", "operator"])

export const parts = pgTable("parts", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  partNumber: text("part_number").notNull(),
  description: text("description").notNull(),
  cycleTimeMachine1: integer("cycle_time_machine1").notNull(),
  cycleTimeMachine2: integer("cycle_time_machine2").notNull(),
  cycleTimeMachine3: integer("cycle_time_machine3").notNull(),
  cycleTimeMachine4: integer("cycle_time_machine4").notNull(),
  bottleneckMachine: integer("bottleneck_machine").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull()
})

export const setupTimes = pgTable(
  "setup_times",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    cellId: uuid("cell_id").notNull(),
    setupTimeMachine1: integer("setup_time_machine1").notNull(),
    setupTimeMachine2: integer("setup_time_machine2").notNull(),
    setupTimeMachine3: integer("setup_time_machine3").notNull(),
    setupTimeMachine4: integer("setup_time_machine4").notNull(),
    date: text("date").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull()
  },
  table => {
    return {
      setupTimesCellIdCellsIdFk: foreignKey({
        columns: [table.cellId],
        foreignColumns: [cells.id],
        name: "setup_times_cell_id_cells_id_fk"
      }).onDelete("cascade")
    }
  }
)

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().notNull(),
  membership: membership("membership").default("free").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  role: userRole("role").default("operator").notNull()
})

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull()
})

export const productionLogs = pgTable(
  "production_logs",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    machineId: uuid("machine_id").notNull(),
    userId: text("user_id").notNull(),
    startTime: timestamp("start_time", { mode: "string" }).notNull(),
    endTime: timestamp("end_time", { mode: "string" }),
    partsProduced: integer("parts_produced").default(0).notNull(),
    actualCycleTime: integer("actual_cycle_time"),
    efficiency: numeric("efficiency", { precision: 5, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull()
  },
  table => {
    return {
      productionLogsMachineIdMachinesIdFk: foreignKey({
        columns: [table.machineId],
        foreignColumns: [machines.id],
        name: "production_logs_machine_id_machines_id_fk"
      }).onDelete("cascade"),
      productionLogsUserIdProfilesUserIdFk: foreignKey({
        columns: [table.userId],
        foreignColumns: [profiles.userId],
        name: "production_logs_user_id_profiles_user_id_fk"
      })
    }
  }
)

export const machines = pgTable(
  "machines",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    cellId: uuid("cell_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").default("idle").notNull(),
    standardCycleTime: numeric("standard_cycle_time").default("0").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    machineType: text("machine_type")
  },
  table => {
    return {
      machinesCellIdCellsIdFk: foreignKey({
        columns: [table.cellId],
        foreignColumns: [cells.id],
        name: "machines_cell_id_cells_id_fk"
      }).onDelete("cascade")
    }
  }
)

export const downtimeLogs = pgTable(
  "downtime_logs",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    machineId: uuid("machine_id").notNull(),
    userId: text("user_id").notNull(),
    startTime: timestamp("start_time", { mode: "string" }).notNull(),
    endTime: timestamp("end_time", { mode: "string" }),
    reason: downtimeReason("reason").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull()
  },
  table => {
    return {
      downtimeLogsMachineIdMachinesIdFk: foreignKey({
        columns: [table.machineId],
        foreignColumns: [machines.id],
        name: "downtime_logs_machine_id_machines_id_fk"
      }).onDelete("cascade"),
      downtimeLogsUserIdProfilesUserIdFk: foreignKey({
        columns: [table.userId],
        foreignColumns: [profiles.userId],
        name: "downtime_logs_user_id_profiles_user_id_fk"
      })
    }
  }
)

export const efficiencyMetrics = pgTable(
  "efficiency_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    date: date("date").notNull(),
    machineId: uuid("machine_id"),
    cellId: uuid("cell_id"),
    valueStreamId: uuid("value_stream_id"),
    siteId: uuid("site_id"),
    companyId: uuid("company_id"),
    totalRuntime: integer("total_runtime").notNull(),
    totalDowntime: integer("total_downtime").notNull(),
    partsProduced: integer("parts_produced").notNull(),
    efficiency: numeric("efficiency", { precision: 5, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull()
  },
  table => {
    return {
      efficiencyMetricsCellIdCellsIdFk: foreignKey({
        columns: [table.cellId],
        foreignColumns: [cells.id],
        name: "efficiency_metrics_cell_id_cells_id_fk"
      }).onDelete("cascade"),
      efficiencyMetricsCompanyIdCompaniesIdFk: foreignKey({
        columns: [table.companyId],
        foreignColumns: [companies.id],
        name: "efficiency_metrics_company_id_companies_id_fk"
      }).onDelete("cascade"),
      efficiencyMetricsMachineIdMachinesIdFk: foreignKey({
        columns: [table.machineId],
        foreignColumns: [machines.id],
        name: "efficiency_metrics_machine_id_machines_id_fk"
      }).onDelete("cascade"),
      efficiencyMetricsSiteIdSitesIdFk: foreignKey({
        columns: [table.siteId],
        foreignColumns: [sites.id],
        name: "efficiency_metrics_site_id_sites_id_fk"
      }).onDelete("cascade"),
      efficiencyMetricsValueStreamIdValueStreamsIdFk: foreignKey({
        columns: [table.valueStreamId],
        foreignColumns: [valueStreams.id],
        name: "efficiency_metrics_value_stream_id_value_streams_id_fk"
      }).onDelete("cascade")
    }
  }
)

export const bottleneckAnalysis = pgTable(
  "bottleneck_analysis",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    date: date("date").notNull(),
    cellId: uuid("cell_id").notNull(),
    bottleneckMachineId: uuid("bottleneck_machine_id"),
    bottleneckSeverity: numeric("bottleneck_severity", {
      precision: 5,
      scale: 2
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull()
  },
  table => {
    return {
      bottleneckAnalysisBottleneckMachineIdMachinesIdFk: foreignKey({
        columns: [table.bottleneckMachineId],
        foreignColumns: [machines.id],
        name: "bottleneck_analysis_bottleneck_machine_id_machines_id_fk"
      }).onDelete("set null"),
      bottleneckAnalysisCellIdCellsIdFk: foreignKey({
        columns: [table.cellId],
        foreignColumns: [cells.id],
        name: "bottleneck_analysis_cell_id_cells_id_fk"
      }).onDelete("cascade")
    }
  }
)

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull()
})

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    companyId: uuid("company_id").notNull(),
    name: text("name").notNull(),
    location: text("location"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull()
  },
  table => {
    return {
      sitesCompanyIdCompaniesIdFk: foreignKey({
        columns: [table.companyId],
        foreignColumns: [companies.id],
        name: "sites_company_id_companies_id_fk"
      }).onDelete("cascade")
    }
  }
)

export const valueStreams = pgTable(
  "value_streams",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    siteId: uuid("site_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull()
  },
  table => {
    return {
      valueStreamsSiteIdSitesIdFk: foreignKey({
        columns: [table.siteId],
        foreignColumns: [sites.id],
        name: "value_streams_site_id_sites_id_fk"
      }).onDelete("cascade")
    }
  }
)

export const cells = pgTable(
  "cells",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    valueStreamId: uuid("value_stream_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull()
  },
  table => {
    return {
      cellsValueStreamIdValueStreamsIdFk: foreignKey({
        columns: [table.valueStreamId],
        foreignColumns: [valueStreams.id],
        name: "cells_value_stream_id_value_streams_id_fk"
      }).onDelete("cascade")
    }
  }
)

export const userAssignments = pgTable(
  "user_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    companyId: uuid("company_id").notNull(),
    siteId: uuid("site_id").notNull(),
    valueStreamId: uuid("value_stream_id"),
    cellId: uuid("cell_id"),
    isPrimary: boolean("is_primary").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull()
  },
  table => {
    return {
      userAssignmentsCellIdCellsIdFk: foreignKey({
        columns: [table.cellId],
        foreignColumns: [cells.id],
        name: "user_assignments_cell_id_cells_id_fk"
      }),
      userAssignmentsCompanyIdCompaniesIdFk: foreignKey({
        columns: [table.companyId],
        foreignColumns: [companies.id],
        name: "user_assignments_company_id_companies_id_fk"
      }),
      userAssignmentsSiteIdSitesIdFk: foreignKey({
        columns: [table.siteId],
        foreignColumns: [sites.id],
        name: "user_assignments_site_id_sites_id_fk"
      }),
      userAssignmentsUserIdProfilesUserIdFk: foreignKey({
        columns: [table.userId],
        foreignColumns: [profiles.userId],
        name: "user_assignments_user_id_profiles_user_id_fk"
      }).onDelete("cascade"),
      userAssignmentsValueStreamIdValueStreamsIdFk: foreignKey({
        columns: [table.valueStreamId],
        foreignColumns: [valueStreams.id],
        name: "user_assignments_value_stream_id_value_streams_id_fk"
      })
    }
  }
)
