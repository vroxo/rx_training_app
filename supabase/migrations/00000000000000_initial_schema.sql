-- =====================================================
-- RX TRAINING APP - SUPABASE DATABASE SCHEMA
-- =====================================================
-- Initial schema migration
-- Consolidates all table creation, constraints, and policies
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Periodizations Table
CREATE TABLE IF NOT EXISTS periodizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  periodization_id UUID REFERENCES periodizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('planned', 'in_progress', 'completed')) DEFAULT 'planned' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ
);

-- Exercises Table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT,
  equipment TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0 NOT NULL,
  completed_at TIMESTAMPTZ,
  conjugated_group UUID,
  conjugated_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ,
  CONSTRAINT exercises_conjugated_order_positive CHECK (conjugated_order IS NULL OR conjugated_order > 0),
  CONSTRAINT exercises_muscle_group_check CHECK (
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
  )
);

-- Sets Table
CREATE TABLE IF NOT EXISTS sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  repetitions INTEGER NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  technique TEXT,
  set_type TEXT,
  rest_time INTEGER,
  rir INTEGER,
  rpe INTEGER,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  drop_set_weights DECIMAL[],
  drop_set_reps JSONB,
  rest_pause_duration INTEGER,
  rest_pause_reps INTEGER[],
  cluster_reps INTEGER,
  cluster_rest_duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ,
  CONSTRAINT sets_set_type_check CHECK (set_type IS NULL OR set_type IN ('warmup', 'feeder', 'workset', 'backoff')),
  CONSTRAINT sets_technique_check CHECK (technique IS NULL OR technique IN ('standard', 'dropset', 'restpause', 'clusterset'))
);

-- Sync Queue Table (for tracking pending changes)
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT CHECK (operation IN ('insert', 'update', 'delete')) NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  synced BOOLEAN DEFAULT FALSE NOT NULL
);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN exercises.completed_at IS 'Timestamp when the exercise was completed during training';
COMMENT ON COLUMN exercises.conjugated_group IS 'UUID that groups exercises together for conjugated sets (Biset, Triset, etc.). All exercises with the same conjugated_group are executed in sequence.';
COMMENT ON COLUMN exercises.conjugated_order IS 'Order of execution within a conjugated group (1, 2, 3...). Only relevant when conjugated_group is set.';
COMMENT ON CONSTRAINT exercises_muscle_group_check ON exercises IS 'Validates that muscle_group contains only predefined values from MUSCLE_GROUPS constant';

COMMENT ON COLUMN sets.completed_at IS 'Timestamp when the set was completed during training';
COMMENT ON COLUMN sets.set_type IS 'Type of set: warmup (warm-up set), feeder (feeder set), workset (work set), backoff (backoff set). NULL means unspecified type.';
COMMENT ON COLUMN sets.drop_set_weights IS 'Array of weights for each drop in a drop set';
COMMENT ON COLUMN sets.drop_set_reps IS 'Array of repetitions for each drop in a drop set (stored as JSONB array)';
COMMENT ON COLUMN sets.rest_pause_duration IS 'Rest duration in seconds for rest-pause technique (5-60s)';
COMMENT ON COLUMN sets.rest_pause_reps IS 'Array of reps for each round in rest-pause technique (e.g., [10, 3, 2])';
COMMENT ON COLUMN sets.cluster_reps IS 'Number of reps per mini-set in cluster technique';
COMMENT ON COLUMN sets.cluster_rest_duration IS 'Rest duration in seconds between clusters (5-60s)';

-- =====================================================
-- INDEXES for better query performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_periodizations_user_id ON periodizations(user_id);
CREATE INDEX IF NOT EXISTS idx_periodizations_deleted_at ON periodizations(deleted_at);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_periodization_id ON sessions(periodization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON sessions(deleted_at);

CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_session_id ON exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_exercises_deleted_at ON exercises(deleted_at);
CREATE INDEX IF NOT EXISTS idx_exercises_completed_at ON exercises(completed_at);
CREATE INDEX IF NOT EXISTS idx_exercises_conjugated_group ON exercises(conjugated_group) WHERE conjugated_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sets_user_id ON sets(user_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_sets_deleted_at ON sets(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sets_completed_at ON sets(completed_at);
CREATE INDEX IF NOT EXISTS idx_sets_set_type ON sets(set_type) WHERE set_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE periodizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Periodizations Policies
CREATE POLICY "Users can view own periodizations"
  ON periodizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own periodizations"
  ON periodizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own periodizations"
  ON periodizations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own periodizations"
  ON periodizations FOR DELETE
  USING (auth.uid() = user_id);

-- Sessions Policies
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Exercises Policies
CREATE POLICY "Users can view own exercises"
  ON exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercises"
  ON exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises"
  ON exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercises"
  ON exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Sets Policies
CREATE POLICY "Users can view own sets"
  ON sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sets"
  ON sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sets"
  ON sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sets"
  ON sets FOR DELETE
  USING (auth.uid() = user_id);

-- Sync Queue Policies
CREATE POLICY "Users can view own sync queue"
  ON sync_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync queue"
  ON sync_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync queue"
  ON sync_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sync queue"
  ON sync_queue FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_periodizations_updated_at
  BEFORE UPDATE ON periodizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sets_updated_at
  BEFORE UPDATE ON sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETED!
-- =====================================================
-- Schema created successfully
-- All migrations consolidated into single initial schema
-- =====================================================

