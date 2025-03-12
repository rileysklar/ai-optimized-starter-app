import { relations } from "drizzle-orm/relations"
import {
  cells,
  setupTimes,
  machines,
  productionLogs,
  profiles,
  downtimeLogs,
  efficiencyMetrics,
  companies,
  sites,
  valueStreams,
  bottleneckAnalysis,
  userAssignments
} from "./schema"

export const setupTimesRelations = relations(setupTimes, ({ one }) => ({
  cell: one(cells, {
    fields: [setupTimes.cellId],
    references: [cells.id]
  })
}))

export const cellsRelations = relations(cells, ({ one, many }) => ({
  setupTimes: many(setupTimes),
  machines: many(machines),
  efficiencyMetrics: many(efficiencyMetrics),
  bottleneckAnalyses: many(bottleneckAnalysis),
  valueStream: one(valueStreams, {
    fields: [cells.valueStreamId],
    references: [valueStreams.id]
  }),
  userAssignments: many(userAssignments)
}))

export const productionLogsRelations = relations(productionLogs, ({ one }) => ({
  machine: one(machines, {
    fields: [productionLogs.machineId],
    references: [machines.id]
  }),
  profile: one(profiles, {
    fields: [productionLogs.userId],
    references: [profiles.userId]
  })
}))

export const machinesRelations = relations(machines, ({ one, many }) => ({
  productionLogs: many(productionLogs),
  cell: one(cells, {
    fields: [machines.cellId],
    references: [cells.id]
  }),
  downtimeLogs: many(downtimeLogs),
  efficiencyMetrics: many(efficiencyMetrics),
  bottleneckAnalyses: many(bottleneckAnalysis)
}))

export const profilesRelations = relations(profiles, ({ many }) => ({
  productionLogs: many(productionLogs),
  downtimeLogs: many(downtimeLogs),
  userAssignments: many(userAssignments)
}))

export const downtimeLogsRelations = relations(downtimeLogs, ({ one }) => ({
  machine: one(machines, {
    fields: [downtimeLogs.machineId],
    references: [machines.id]
  }),
  profile: one(profiles, {
    fields: [downtimeLogs.userId],
    references: [profiles.userId]
  })
}))

export const efficiencyMetricsRelations = relations(
  efficiencyMetrics,
  ({ one }) => ({
    cell: one(cells, {
      fields: [efficiencyMetrics.cellId],
      references: [cells.id]
    }),
    company: one(companies, {
      fields: [efficiencyMetrics.companyId],
      references: [companies.id]
    }),
    machine: one(machines, {
      fields: [efficiencyMetrics.machineId],
      references: [machines.id]
    }),
    site: one(sites, {
      fields: [efficiencyMetrics.siteId],
      references: [sites.id]
    }),
    valueStream: one(valueStreams, {
      fields: [efficiencyMetrics.valueStreamId],
      references: [valueStreams.id]
    })
  })
)

export const companiesRelations = relations(companies, ({ many }) => ({
  efficiencyMetrics: many(efficiencyMetrics),
  sites: many(sites),
  userAssignments: many(userAssignments)
}))

export const sitesRelations = relations(sites, ({ one, many }) => ({
  efficiencyMetrics: many(efficiencyMetrics),
  company: one(companies, {
    fields: [sites.companyId],
    references: [companies.id]
  }),
  valueStreams: many(valueStreams),
  userAssignments: many(userAssignments)
}))

export const valueStreamsRelations = relations(
  valueStreams,
  ({ one, many }) => ({
    efficiencyMetrics: many(efficiencyMetrics),
    site: one(sites, {
      fields: [valueStreams.siteId],
      references: [sites.id]
    }),
    cells: many(cells),
    userAssignments: many(userAssignments)
  })
)

export const bottleneckAnalysisRelations = relations(
  bottleneckAnalysis,
  ({ one }) => ({
    machine: one(machines, {
      fields: [bottleneckAnalysis.bottleneckMachineId],
      references: [machines.id]
    }),
    cell: one(cells, {
      fields: [bottleneckAnalysis.cellId],
      references: [cells.id]
    })
  })
)

export const userAssignmentsRelations = relations(
  userAssignments,
  ({ one }) => ({
    cell: one(cells, {
      fields: [userAssignments.cellId],
      references: [cells.id]
    }),
    company: one(companies, {
      fields: [userAssignments.companyId],
      references: [companies.id]
    }),
    site: one(sites, {
      fields: [userAssignments.siteId],
      references: [sites.id]
    }),
    profile: one(profiles, {
      fields: [userAssignments.userId],
      references: [profiles.userId]
    }),
    valueStream: one(valueStreams, {
      fields: [userAssignments.valueStreamId],
      references: [valueStreams.id]
    })
  })
)
