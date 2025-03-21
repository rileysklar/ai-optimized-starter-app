-- Migration for adding shifts table

-- Up Migration
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  cell_id UUID REFERENCES cells(id),
  shift_type TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  attainment_percentage NUMERIC,
  total_loss_minutes INTEGER,
  total_break_minutes INTEGER,
  completed BOOLEAN DEFAULT false,
  production_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indexes for fields frequently used in WHERE clauses
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_cell_id ON shifts(cell_id);
CREATE INDEX IF NOT EXISTS idx_shifts_completed ON shifts(completed);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);

-- Row-level security
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own shifts"
ON shifts FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own shifts"
ON shifts FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own shifts"
ON shifts FOR UPDATE
USING (auth.uid()::text = user_id);

-- Down Migration
-- In case you need to roll back this change
/* 
DROP POLICY IF EXISTS "Users can view their own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can insert their own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can update their own shifts" ON shifts;
DROP TABLE IF EXISTS shifts;
*/
