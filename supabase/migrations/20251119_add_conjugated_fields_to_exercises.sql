-- Migration: Add conjugated fields to exercises table
-- This allows exercises to be grouped as Biset, Triset, etc.

-- Add conjugated_group column (UUID to group exercises together)
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS conjugated_group UUID;

-- Add conjugated_order column (order of exercise within the conjugated group: 1, 2, 3...)
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS conjugated_order INTEGER;

-- Add comments explaining the columns
COMMENT ON COLUMN exercises.conjugated_group IS 
'UUID that groups exercises together for conjugated sets (Biset, Triset, etc.). All exercises with the same conjugated_group are executed in sequence.';

COMMENT ON COLUMN exercises.conjugated_order IS 
'Order of execution within a conjugated group (1, 2, 3...). Only relevant when conjugated_group is set.';

-- Add check constraint to ensure conjugated_order is positive when set
ALTER TABLE exercises
ADD CONSTRAINT exercises_conjugated_order_positive 
CHECK (conjugated_order IS NULL OR conjugated_order > 0);

-- Optional: Add index for faster querying of conjugated groups
CREATE INDEX IF NOT EXISTS idx_exercises_conjugated_group 
ON exercises(conjugated_group) 
WHERE conjugated_group IS NOT NULL;

