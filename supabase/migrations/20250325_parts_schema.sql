-- Create parts table
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT NOT NULL,
  description TEXT NOT NULL,
  cycle_time_machine1 INTEGER NOT NULL,
  cycle_time_machine2 INTEGER NOT NULL,
  cycle_time_machine3 INTEGER NOT NULL,
  cycle_time_machine4 INTEGER NOT NULL,
  bottleneck_machine INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_parts_part_number ON parts(part_number);

-- Row Level Security Policies
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all parts
CREATE POLICY "Users can view all parts"
ON parts
FOR SELECT
USING (true);

-- Allow authenticated users to insert parts
CREATE POLICY "Users can insert parts"
ON parts
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to update parts
CREATE POLICY "Users can update parts"
ON parts
FOR UPDATE
USING (true);

-- Allow authenticated users to delete parts
CREATE POLICY "Users can delete parts"
ON parts
FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON parts
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp(); 