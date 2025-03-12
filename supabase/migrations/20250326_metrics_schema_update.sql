-- Migration to add missing columns to efficiency_metrics table
-- This addresses the "column attainment_percentage does not exist" error

ALTER TABLE "efficiency_metrics" 
  ADD COLUMN IF NOT EXISTS "attainment_percentage" DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS "target_count" TEXT,
  ADD COLUMN IF NOT EXISTS "actual_count" TEXT,
  ADD COLUMN IF NOT EXISTS "downtime_minutes" TEXT;

-- Add comments to explain the purpose of these columns
COMMENT ON COLUMN "efficiency_metrics"."attainment_percentage" IS 'Actual vs target production percentage';
COMMENT ON COLUMN "efficiency_metrics"."target_count" IS 'Expected production count for the time period';
COMMENT ON COLUMN "efficiency_metrics"."actual_count" IS 'Actual production count achieved';
COMMENT ON COLUMN "efficiency_metrics"."downtime_minutes" IS 'Downtime in minutes for easy display';

-- Update existing records to have attainment_percentage equal to efficiency
UPDATE "efficiency_metrics"
SET "attainment_percentage" = CAST("efficiency" AS DECIMAL(5,2))
WHERE "attainment_percentage" IS NULL AND "efficiency" IS NOT NULL;

-- Update existing records to have downtime_minutes calculated from totalDowntime
UPDATE "efficiency_metrics"
SET "downtime_minutes" = CAST(ROUND("totalDowntime" / 60) AS TEXT)
WHERE "downtime_minutes" IS NULL AND "totalDowntime" IS NOT NULL; 