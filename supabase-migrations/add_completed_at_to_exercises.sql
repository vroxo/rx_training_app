-- Add completed_at field to exercises table
-- This allows tracking when individual exercises are completed during training

ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add index for better query performance when filtering by completed exercises
CREATE INDEX IF NOT EXISTS idx_exercises_completed_at ON exercises(completed_at);

-- Comment explaining the field
COMMENT ON COLUMN exercises.completed_at IS 'Timestamp when the exercise was completed during training';

