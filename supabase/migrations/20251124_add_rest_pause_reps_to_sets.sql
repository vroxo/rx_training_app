-- Add rest_pause_reps field to sets table
-- Migration: 20251124_add_rest_pause_reps_to_sets

-- Add rest pause reps array
ALTER TABLE sets ADD COLUMN IF NOT EXISTS rest_pause_reps INTEGER[] DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN sets.rest_pause_reps IS 'Array of reps for each round in rest-pause technique (e.g., [10, 3, 2])';

