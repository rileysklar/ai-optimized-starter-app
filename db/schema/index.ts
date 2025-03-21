/*
<ai_context>
Exports the database schema for the app.
Updated: Added manufacturing schema exports
</ai_context>
*/

// Export non-conflicting schemas directly
export * from "./profiles-schema"
export * from "./contacts-schema"
export * from "./metrics-schema"
export * from "./parts-schema"
export * from "./setup-times-schema"
export * from "./shifts-schema"

// Import from manufacturing-schema - main schema
import {
  companiesTable,
  sitesTable,
  valueStreamsTable,
  cellsTable,
  machinesTable,
  userAssignmentsTable,
  InsertCompany,
  SelectCompany,
  InsertSite,
  SelectSite,
  InsertValueStream,
  SelectValueStream,
  InsertCell,
  SelectCell,
  InsertMachine,
  SelectMachine,
  InsertUserAssignment,
  SelectUserAssignment
} from "./manufacturing-schema"

// Import from production-schema with renamed identifiers
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

// Re-export manufacturing schema tables and types
export {
  companiesTable,
  sitesTable,
  valueStreamsTable,
  cellsTable,
  machinesTable,
  userAssignmentsTable
}

// Re-export manufacturing schema types
export type {
  InsertCompany,
  SelectCompany,
  InsertSite,
  SelectSite,
  InsertValueStream,
  SelectValueStream,
  InsertCell,
  SelectCell,
  InsertMachine,
  SelectMachine,
  InsertUserAssignment,
  SelectUserAssignment
}

// Re-export production schema tables
export {
  productionMachinesTable,
  productionLogsTable,
  downtimeLogsTable,
  machineStatusEnum,
  downtimeReasonEnum
}

// Re-export production schema types
export type {
  InsertProductionMachine,
  SelectProductionMachine,
  InsertProductionLog,
  SelectProductionLog,
  InsertDowntimeLog,
  SelectDowntimeLog
}
