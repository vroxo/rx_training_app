-- Migration: Add set_type column to sets table
-- This allows classification of sets as warmup, feeder, workset, or backoff

-- Add check constraint to ensure valid set types
ALTER TABLE sets
ADD CONSTRAINT sets_set_type_check 
CHECK (set_type IS NULL OR set_type IN ('warmup', 'feeder', 'workset', 'backoff'));

-- Add comment explaining the column
COMMENT ON COLUMN sets.set_type IS 
'Type of set: warmup (warm-up set), feeder (feeder set), workset (work set), backoff (backoff set). NULL means unspecified type.';

-- Create index for faster filtering by set type (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_sets_set_type 
ON sets(set_type) 
WHERE set_type IS NOT NULL;

