-- Add technique fields to sets table
-- Migration: 20251120_add_technique_fields_to_sets

-- Drop Set fields
ALTER TABLE sets ADD COLUMN IF NOT EXISTS drop_set_weights DECIMAL[] DEFAULT NULL;

-- Rest Pause fields
ALTER TABLE sets ADD COLUMN IF NOT EXISTS rest_pause_duration INTEGER DEFAULT NULL;

-- Cluster Set fields
ALTER TABLE sets ADD COLUMN IF NOT EXISTS cluster_reps INTEGER DEFAULT NULL;
ALTER TABLE sets ADD COLUMN IF NOT EXISTS cluster_rest_duration INTEGER DEFAULT NULL;

-- Add check constraint for technique values
ALTER TABLE sets DROP CONSTRAINT IF EXISTS sets_technique_check;
ALTER TABLE sets ADD CONSTRAINT sets_technique_check 
  CHECK (technique IS NULL OR technique IN ('standard', 'dropset', 'restpause', 'clusterset'));

-- Add comments
COMMENT ON COLUMN sets.drop_set_weights IS 'Array of weights for each drop in a drop set';
COMMENT ON COLUMN sets.rest_pause_duration IS 'Rest duration in seconds for rest-pause technique (5-60s)';
COMMENT ON COLUMN sets.cluster_reps IS 'Number of reps per mini-set in cluster technique';
COMMENT ON COLUMN sets.cluster_rest_duration IS 'Rest duration in seconds between clusters (5-60s)';

