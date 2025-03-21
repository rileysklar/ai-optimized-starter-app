/*
<ai_context>
Exports the database schema for the app.
Updated: Added manufacturing schema exports
</ai_context>
*/

// Export schemas
export * from "./profiles-schema"
export * from "./contacts-schema"
export * from "./manufacturing-schema"
export * from "./production-schema"
export * from "./metrics-schema"
export * from "./parts-schema"
export * from "./setup-times-schema"
export * from "./shifts-schema"

// Import and rename conflicting exports from production-schema
import {
  machinesTable as productionMachinesTable,
  productionLogsTable,
  downtimeLogsTable,
  machineStatusEnum,
  downtimeReasonEnum,
  InsertMachine as InsertProductionMachine,
  SelectMachine as SelectProductionMachine,
  InsertProductionLog,
  SelectProductionLog,
  InsertDowntimeLog,
  SelectDowntimeLog
} from "./production-schema"

// Re-export with renamed identifiers
export {
  productionMachinesTable,
  productionLogsTable,
  downtimeLogsTable,
  machineStatusEnum,
  downtimeReasonEnum
}

// Re-export types with renamed identifiers
export type {
  InsertProductionMachine,
  SelectProductionMachine,
  InsertProductionLog,
  SelectProductionLog,
  InsertDowntimeLog,
  SelectDowntimeLog
}
