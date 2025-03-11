-- Manufacturing Efficiency Tracking System Schema Migration
-- This migration adds the necessary tables for manufacturing efficiency tracking
-- while preserving the existing profiles and contacts tables

-- Create role & status enums
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('admin', 'supervisor', 'operator');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 CREATE TYPE "public"."machine_status" AS ENUM('idle', 'running', 'down', 'maintenance');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 CREATE TYPE "public"."downtime_reason" AS ENUM('setup', 'breakdown', 'material_shortage', 'quality_issue', 'changeover', 'scheduled_maintenance', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Update profiles table to include role
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "role" "user_role" DEFAULT 'operator' NOT NULL;
--> statement-breakpoint

-- Create manufacturing hierarchy tables

-- Companies table
CREATE TABLE IF NOT EXISTS "companies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Sites table
CREATE TABLE IF NOT EXISTS "sites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "location" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Value Streams table
CREATE TABLE IF NOT EXISTS "value_streams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Cells table
CREATE TABLE IF NOT EXISTS "cells" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "value_stream_id" uuid NOT NULL REFERENCES "value_streams"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- User assignments - link users to company, site, value stream, and cell
CREATE TABLE IF NOT EXISTS "user_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "site_id" uuid NOT NULL REFERENCES "sites"("id"),
  "value_stream_id" uuid REFERENCES "value_streams"("id"),
  "cell_id" uuid REFERENCES "cells"("id"),
  "is_primary" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("user_id", "company_id", "site_id", "value_stream_id", "cell_id")
);
--> statement-breakpoint

-- Machines table
CREATE TABLE IF NOT EXISTS "machines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cell_id" uuid NOT NULL REFERENCES "cells"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "status" "machine_status" DEFAULT 'idle' NOT NULL,
  "standard_cycle_time" integer NOT NULL, -- in seconds
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Production Logs table
CREATE TABLE IF NOT EXISTS "production_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "machine_id" uuid NOT NULL REFERENCES "machines"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "profiles"("user_id"),
  "start_time" timestamp NOT NULL,
  "end_time" timestamp,
  "parts_produced" integer DEFAULT 0 NOT NULL,
  "actual_cycle_time" integer, -- in seconds, calculated on completion
  "efficiency" decimal(5,2), -- stored as percentage
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Downtime Logs table
CREATE TABLE IF NOT EXISTS "downtime_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "machine_id" uuid NOT NULL REFERENCES "machines"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "profiles"("user_id"),
  "start_time" timestamp NOT NULL,
  "end_time" timestamp,
  "reason" "downtime_reason" NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Efficiency Metrics table (daily aggregates)
CREATE TABLE IF NOT EXISTS "efficiency_metrics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "date" date NOT NULL,
  "machine_id" uuid REFERENCES "machines"("id") ON DELETE CASCADE,
  "cell_id" uuid REFERENCES "cells"("id") ON DELETE CASCADE,
  "value_stream_id" uuid REFERENCES "value_streams"("id") ON DELETE CASCADE,
  "site_id" uuid REFERENCES "sites"("id") ON DELETE CASCADE,
  "company_id" uuid REFERENCES "companies"("id") ON DELETE CASCADE,
  "total_runtime" integer NOT NULL, -- in seconds
  "total_downtime" integer NOT NULL, -- in seconds
  "parts_produced" integer NOT NULL,
  "efficiency" decimal(5,2) NOT NULL, -- stored as percentage
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  -- Ensure we only have one entry per entity per day
  UNIQUE("date", "machine_id"),
  UNIQUE("date", "cell_id"),
  UNIQUE("date", "value_stream_id"),
  UNIQUE("date", "site_id"),
  UNIQUE("date", "company_id")
);
--> statement-breakpoint

-- Bottleneck Analysis table
CREATE TABLE IF NOT EXISTS "bottleneck_analysis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "date" date NOT NULL,
  "cell_id" uuid NOT NULL REFERENCES "cells"("id") ON DELETE CASCADE,
  "bottleneck_machine_id" uuid REFERENCES "machines"("id") ON DELETE SET NULL,
  "bottleneck_severity" decimal(5,2), -- percentage impact on throughput
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("date", "cell_id")
);
--> statement-breakpoint

-- Enable Row Level Security
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "value_streams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cells" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "machines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "production_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "downtime_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "efficiency_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bottleneck_analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Create policies for each table based on user assignments
CREATE POLICY "Users can access assigned companies"
ON "companies"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "user_assignments"
    WHERE "user_assignments"."company_id" = "companies"."id"
    AND "user_assignments"."user_id" = auth.uid()::text
  )
);
--> statement-breakpoint

CREATE POLICY "Users can access assigned sites"
ON "sites"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "user_assignments"
    WHERE "user_assignments"."site_id" = "sites"."id"
    AND "user_assignments"."user_id" = auth.uid()::text
  )
);
--> statement-breakpoint

CREATE POLICY "Users can access assigned value streams"
ON "value_streams"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "user_assignments"
    WHERE "user_assignments"."value_stream_id" = "value_streams"."id"
    AND "user_assignments"."user_id" = auth.uid()::text
  )
);
--> statement-breakpoint

CREATE POLICY "Users can access assigned cells"
ON "cells"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "user_assignments"
    WHERE "user_assignments"."cell_id" = "cells"."id"
    AND "user_assignments"."user_id" = auth.uid()::text
  )
);
--> statement-breakpoint

CREATE POLICY "Users can access assigned machines"
ON "machines"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "user_assignments"
    WHERE "user_assignments"."cell_id" = "machines"."cell_id"
    AND "user_assignments"."user_id" = auth.uid()::text
  )
);
--> statement-breakpoint

CREATE POLICY "Users can access assigned production logs"
ON "production_logs"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "machines" m
    JOIN "user_assignments" ua ON m."cell_id" = ua."cell_id"
    WHERE "production_logs"."machine_id" = m."id"
    AND ua."user_id" = auth.uid()::text
  )
);
--> statement-breakpoint

CREATE POLICY "Users can access assigned downtime logs"
ON "downtime_logs"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "machines" m
    JOIN "user_assignments" ua ON m."cell_id" = ua."cell_id"
    WHERE "downtime_logs"."machine_id" = m."id"
    AND ua."user_id" = auth.uid()::text
  )
);
--> statement-breakpoint

CREATE POLICY "Users can access assigned efficiency metrics"
ON "efficiency_metrics"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "machines" m
    JOIN "user_assignments" ua ON m."cell_id" = ua."cell_id"
    WHERE "efficiency_metrics"."machine_id" = m."id"
    AND ua."user_id" = auth.uid()::text
  )
);
--> statement-breakpoint

CREATE POLICY "Users can access assigned bottleneck analysis"
ON "bottleneck_analysis"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "cells" c
    JOIN "user_assignments" ua ON c."id" = ua."cell_id"
    WHERE "bottleneck_analysis"."cell_id" = c."id"
    AND ua."user_id" = auth.uid()::text
  )
);
--> statement-breakpoint

CREATE POLICY "Users can access their own assignments"
ON "user_assignments"
FOR ALL
USING (
  "user_id" = auth.uid()::text
);
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_production_logs_machine_id" ON "production_logs" ("machine_id");
CREATE INDEX IF NOT EXISTS "idx_production_logs_user_id" ON "production_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_production_logs_start_time" ON "production_logs" ("start_time");
CREATE INDEX IF NOT EXISTS "idx_downtime_logs_machine_id" ON "downtime_logs" ("machine_id");
CREATE INDEX IF NOT EXISTS "idx_machines_cell_id" ON "machines" ("cell_id");
CREATE INDEX IF NOT EXISTS "idx_cells_value_stream_id" ON "cells" ("value_stream_id");
CREATE INDEX IF NOT EXISTS "idx_value_streams_site_id" ON "value_streams" ("site_id");
CREATE INDEX IF NOT EXISTS "idx_sites_company_id" ON "sites" ("company_id");
CREATE INDEX IF NOT EXISTS "idx_user_assignments_user_id" ON "user_assignments" ("user_id"); 