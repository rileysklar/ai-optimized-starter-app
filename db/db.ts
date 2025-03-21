/*
<ai_context>
Initializes the database connection and schema for the app.
Updated to include manufacturing efficiency tracking system schemas.
</ai_context>
*/

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { config } from "dotenv"
import {
  profilesTable,
  contactsTable,
  companiesTable,
  sitesTable,
  valueStreamsTable,
  cellsTable,
  userAssignmentsTable,
  machinesTable,
  productionLogsTable,
  downtimeLogsTable,
  efficiencyMetricsTable,
  bottleneckAnalysisTable,
  partsTable,
  shiftsTable
} from "@/db/schema"

// Load environment variables
config({ path: ".env.local" })

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

const connectionString = process.env.DATABASE_URL!

let conn: postgres.Sql

if (process.env.NODE_ENV === "production") {
  conn = postgres(connectionString, { prepare: false })
} else {
  if (!globalForDb.conn) {
    globalForDb.conn = postgres(connectionString, { prepare: false })
  }
  conn = globalForDb.conn
}

/**
 * Database schema for the app.
 *
 * Includes:
 * - Profiles and Contacts
 * - Manufacturing Hierarchy (Companies, Sites, Value Streams, Cells)
 * - Production Tracking (Machines, Production Logs, Downtime Logs)
 * - Metrics and Analysis (Efficiency Metrics, Bottleneck Analysis)
 * - Parts (defined in parts-schema.ts)
 * - Shifts (defined in shifts-schema.ts)
 */
const schema = {
  profiles: profilesTable,
  contacts: contactsTable,
  companies: companiesTable,
  sites: sitesTable,
  valueStreams: valueStreamsTable,
  cells: cellsTable,
  userAssignments: userAssignmentsTable,
  machines: machinesTable,
  productionLogs: productionLogsTable,
  downtimeLogs: downtimeLogsTable,
  efficiencyMetrics: efficiencyMetricsTable,
  bottleneckAnalysis: bottleneckAnalysisTable,
  parts: partsTable,
  shifts: shiftsTable
}

const db = drizzle(conn, { schema })

export { db }
