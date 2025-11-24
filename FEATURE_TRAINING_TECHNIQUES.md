# Feature: Training Techniques (Técnicas de Treino)

## Status
✅ **Implemented** - Aguardando aplicação da migration no Supabase

## Date
November 20, 2025

## Description
Sistema completo de técnicas avançadas de treino que permite aos usuários aplicar métodos específicos em cada série:

### Técnicas Implementadas

1. **Drop Set** (Série Descendente)
   - Permite adicionar múltiplos "drops" (reduções de peso)
   - Cada drop tem seu próprio campo de peso
   - Ideal para hipertrofia e fadiga muscular máxima

2. **Rest Pause** (Pausa de Descanso)
   - Define duração das micro-pausas durante a série
   - Configurável entre 5-60 segundos
   - Permite continuar a série após breve descanso

3. **Cluster Set** (Série em Clusters)
   - Define número de repetições por mini-série
   - Define tempo de descanso entre clusters
   - Ambos configuráveis

## Changes Made

### 1. Data Model
- **File**: `src/models/Set.ts`
- **Changes**:
  ```typescript
  technique?: TechniqueType | string;
  dropSetWeights?: number[];        // Drop Set
  restPauseDuration?: number;       // Rest Pause (5-60s)
  clusterReps?: number;             // Cluster Set
  clusterRestDuration?: number;     // Cluster Set (5-60s)
  ```

### 2. Constants
- **File**: `src/constants/techniques.ts` (New)
- **Exports**:
  - `TechniqueType`: Type definition
  - `TECHNIQUES`: Array of technique options
  - `getTechniqueLabel()`: Get display label
  - `getTechniqueColor()`: Get badge color

### 3. Validation Schema
- **File**: `src/schemas/set.schema.ts`
- **Validation**: Zod schemas for all technique fields with min/max constraints

### 4. Database (SQLite Local)
- **File**: `src/services/database/schema.ts`
- **Columns Added**:
  - `drop_set_weights TEXT` (JSON array)
  - `rest_pause_duration INTEGER`
  - `cluster_reps INTEGER`
  - `cluster_rest_duration INTEGER`
- **Migration**: Auto-applied on app initialization

### 5. Sync Service
- **File**: `src/services/sync/SyncService.ts`
- **Changes**: Push/pull operations updated to sync technique fields

### 6. UI Components

#### TechniqueFields Component (New)
- **File**: `src/components/TechniqueFields.tsx`
- **Features**:
  - Dynamic fields based on selected technique
  - Add/remove drops for Drop Set
  - Number inputs for Rest Pause and Cluster Set
  - Styled with technique-specific colors

#### SessionDetailScreen Updates
- **File**: `src/screens/SessionDetailScreen.tsx`
- **Features**:
  - Select component for technique selection
  - TechniqueFields component integration
  - Technique badges in set display
  - Save/load technique data

## Database Migration (Supabase)

### Migration File
- **Path**: `supabase/migrations/20251120_add_technique_fields_to_sets.sql`

### Manual Application Steps

1. **Access Supabase Dashboard**
   - Navigate to your project
   - Go to "SQL Editor"

2. **Run Migration**
   ```sql
   -- Copy and paste contents of:
   -- supabase/migrations/20251120_add_technique_fields_to_sets.sql
   ```

3. **Verify Installation**
   ```sql
   -- Check columns
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'sets' 
   AND column_name IN (
     'drop_set_weights',
     'rest_pause_duration',
     'cluster_reps',
     'cluster_rest_duration'
   );
   
   -- Check constraint
   SELECT constraint_name, check_clause
   FROM information_schema.check_constraints
   WHERE constraint_name = 'sets_technique_check';
   ```

### Expected Results
- 4 new columns in `sets` table
- 1 CHECK constraint for technique validation
- All existing data remains intact

## Usage Guide

### Creating a Set with Technique

1. **Open Session Detail Screen**
2. **Add or Edit a Set**
3. **Select Technique** from dropdown:
   - Padrão (Standard)
   - Drop Set
   - Rest Pause
   - Cluster Set

4. **Configure Technique-Specific Fields**:

   **For Drop Set:**
   - Click "Adicionar Drop" to add weight drops
   - Enter weight for each drop
   - Remove drops as needed

   **For Rest Pause:**
   - Enter rest duration in seconds (5-60s)
   - This is the pause time between reps

   **For Cluster Set:**
   - Enter reps per cluster (mini-set)
   - Enter rest duration between clusters (5-60s)

5. **Save the Set**

### Viewing Sets with Techniques

- Sets display colored badges showing the technique applied
- Badge colors:
  - **Drop Set**: Purple (#8B5CF6)
  - **Rest Pause**: Pink (#EC4899)
  - **Cluster Set**: Teal (#14B8A6)

## Technical Details

### Data Storage

#### SQLite (Local)
- `drop_set_weights`: Stored as JSON string
- Other fields: Stored as INTEGER

#### Supabase (Cloud)
- `drop_set_weights`: DECIMAL[] (PostgreSQL array)
- Other fields: INTEGER

### Synchronization
- Bidirectional sync (push/pull)
- Automatic JSON parsing/stringifying for arrays
- Conflict resolution: server wins

## Testing Checklist

After applying the migration:

- [ ] Apply Supabase migration
- [ ] Restart the app
- [ ] Create a set with Drop Set technique
- [ ] Add multiple drops and verify saving
- [ ] Create a set with Rest Pause technique
- [ ] Create a set with Cluster Set technique
- [ ] Verify badges display correctly
- [ ] Test synchronization (online → offline → online)
- [ ] Verify data persists after app restart
- [ ] Check that techniques show on different screens

## Future Enhancements

1. **More Techniques**:
   - Superset
   - Giant Set
   - Pre-exhaustion
   - Post-exhaustion

2. **Analytics**:
   - Track which techniques produce best results
   - Suggest techniques based on goals

3. **Templates**:
   - Save favorite technique combinations
   - Quick apply to multiple sets

4. **Performance Tracking**:
   - Compare results with/without techniques
   - Visualize technique effectiveness

## Rollback (if needed)

### SQLite
- Auto-handled on next schema update
- Old data preserved

### Supabase
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

- All technique fields are optional
- Standard technique requires no additional fields
- Technique data is preserved during sync
- Web and mobile apps have consistent behavior
- SQLite migration runs automatically on initialization

## Support

If you encounter issues:
1. Check browser/app console for errors
2. Verify migration was applied correctly in Supabase
3. Clear app cache and reload
4. Check that sets table has all required columns

