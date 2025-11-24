# Migration: Technique Fields for Sets

## Overview
Adds support for advanced training techniques (Drop Set, Rest Pause, Cluster Set) to the sets table.

## Date
November 20, 2025

## Changes
- Adds `drop_set_weights` (DECIMAL[]) column for Drop Set technique
- Adds `rest_pause_duration` (INTEGER) column for Rest Pause technique
- Adds `cluster_reps` (INTEGER) column for Cluster Set technique
- Adds `cluster_rest_duration` (INTEGER) column for Cluster Set technique
- Adds CHECK constraint for valid technique values

## Manual Application Steps

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to "SQL Editor"

2. **Run the Migration**
   - Copy the contents of `supabase/migrations/20251120_add_technique_fields_to_sets.sql`
   - Paste into the SQL Editor
   - Click "RUN"

3. **Verify the Changes**
   ```sql
   -- Check if columns were added
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'sets' 
   AND column_name IN (
     'drop_set_weights',
     'rest_pause_duration',
     'cluster_reps',
     'cluster_rest_duration'
   );
   
   -- Verify constraint
   SELECT constraint_name, check_clause
   FROM information_schema.check_constraints
   WHERE constraint_name = 'sets_technique_check';
   ```

4. **Expected Result**
   You should see 4 new columns and 1 constraint:
   - `drop_set_weights` - ARRAY (DECIMAL[])
   - `rest_pause_duration` - INTEGER
   - `cluster_reps` - INTEGER
   - `cluster_rest_duration` - INTEGER
   - Constraint: `sets_technique_check`

## Rollback (if needed)
```sql
-- Remove columns
ALTER TABLE sets DROP COLUMN IF EXISTS drop_set_weights;
ALTER TABLE sets DROP COLUMN IF EXISTS rest_pause_duration;
ALTER TABLE sets DROP COLUMN IF EXISTS cluster_reps;
ALTER TABLE sets DROP COLUMN IF EXISTS cluster_rest_duration;

-- Remove constraint
ALTER TABLE sets DROP CONSTRAINT IF EXISTS sets_technique_check;
```

## Notes
- All new columns are nullable (optional)
- Existing data is not affected
- The constraint allows NULL or one of the predefined technique values
- Drop Set weights are stored as an array of decimals
- Rest pause and cluster durations are in seconds (5-60s range validated in app)

