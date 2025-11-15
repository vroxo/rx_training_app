-- Add completed_at field to sets table
-- This allows tracking when individual sets are completed during training

ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add index for better query performance when filtering by completed sets
CREATE INDEX IF NOT EXISTS idx_sets_completed_at ON sets(completed_at);

-- Comment explaining the field
COMMENT ON COLUMN sets.completed_at IS 'Timestamp when the set was completed during training';

