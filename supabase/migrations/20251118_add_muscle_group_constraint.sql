-- Migration: Add CHECK constraint to muscle_group column in exercises table
-- This ensures only valid muscle group values can be stored

-- Add CHECK constraint to validate muscle_group values
ALTER TABLE exercises
DROP CONSTRAINT IF EXISTS exercises_muscle_group_check;

ALTER TABLE exercises
ADD CONSTRAINT exercises_muscle_group_check 
CHECK (
  muscle_group IS NULL OR
  muscle_group IN (
    'peito',
    'costas',
    'ombros',
    'biceps',
    'triceps',
    'antebraco',
    'abdomen',
    'quadriceps',
    'posterior',
    'gluteos',
    'panturrilha',
    'trapezio',
    'lombar'
  )
);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT exercises_muscle_group_check ON exercises IS 
'Validates that muscle_group contains only predefined values from MUSCLE_GROUPS constant';

-- Update existing data: set invalid values to NULL
UPDATE exercises
SET muscle_group = NULL
WHERE muscle_group IS NOT NULL
  AND muscle_group NOT IN (
    'peito',
    'costas',
    'ombros',
    'biceps',
    'triceps',
    'antebraco',
    'abdomen',
    'quadriceps',
    'posterior',
    'gluteos',
    'panturrilha',
    'trapezio',
    'lombar'
  );

