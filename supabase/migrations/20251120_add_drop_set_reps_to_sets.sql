-- Migration: Add drop_set_reps to sets table
-- Date: 2025-11-20
-- Description: Adds JSONB column to store repetitions for each drop in a drop set

-- Add drop_set_reps column to sets table
ALTER TABLE sets
ADD COLUMN drop_set_reps JSONB;

-- Add comment to column
COMMENT ON COLUMN sets.drop_set_reps IS 'Array of repetitions for each drop in a drop set (stored as JSONB array)';

