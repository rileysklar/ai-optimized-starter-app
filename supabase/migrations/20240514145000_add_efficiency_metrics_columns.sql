-- Add missing columns to efficiency_metrics table
ALTER TABLE IF EXISTS "efficiency_metrics"
ADD COLUMN IF NOT EXISTS "attainment_percentage" DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS "target_count" TEXT,
ADD COLUMN IF NOT EXISTS "actual_count" TEXT,
ADD COLUMN IF NOT EXISTS "downtime_minutes" TEXT;

-- Add comments to document what each column is for
COMMENT ON COLUMN "efficiency_metrics"."attainment_percentage" IS 'Percentage of target production achieved';
COMMENT ON COLUMN "efficiency_metrics"."target_count" IS 'Expected production count for the time period';
COMMENT ON COLUMN "efficiency_metrics"."actual_count" IS 'Actual production count achieved';
COMMENT ON COLUMN "efficiency_metrics"."downtime_minutes" IS 'Downtime in minutes for easy display'; 