ALTER TABLE "production_logs" ADD COLUMN "target_count" text;--> statement-breakpoint
ALTER TABLE "efficiency_metrics" ADD COLUMN "attainment_percentage" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "efficiency_metrics" ADD COLUMN "target_count" text;--> statement-breakpoint
ALTER TABLE "efficiency_metrics" ADD COLUMN "actual_count" text;--> statement-breakpoint
ALTER TABLE "efficiency_metrics" ADD COLUMN "downtime_minutes" text;