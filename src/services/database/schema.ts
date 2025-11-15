// SQLite Database Schema
// This mirrors the Supabase schema for offline-first functionality

export const CREATE_TABLES_SQL = `
  -- Periodizations Table
  CREATE TABLE IF NOT EXISTS periodizations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    synced_at TEXT,
    needs_sync INTEGER DEFAULT 1
  );

  -- Sessions Table
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    periodization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    scheduled_at TEXT,
    completed_at TEXT,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    synced_at TEXT,
    needs_sync INTEGER DEFAULT 1,
    FOREIGN KEY (periodization_id) REFERENCES periodizations(id) ON DELETE CASCADE
  );

  -- Exercises Table
  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    muscle_group TEXT,
    equipment TEXT,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    synced_at TEXT,
    needs_sync INTEGER DEFAULT 1,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  -- Sets Table
  CREATE TABLE IF NOT EXISTS sets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    repetitions INTEGER NOT NULL,
    weight REAL NOT NULL,
    technique TEXT,
    set_type TEXT CHECK (set_type IN ('warmup', 'feeder', 'workset', 'backoff')),
    rest_time INTEGER,
    rir INTEGER,
    rpe INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    synced_at TEXT,
    needs_sync INTEGER DEFAULT 1,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
  );

  -- Sync Queue Table
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT CHECK (operation IN ('insert', 'update', 'delete')),
    data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 0
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_periodizations_user_id ON periodizations(user_id);
  CREATE INDEX IF NOT EXISTS idx_periodizations_needs_sync ON periodizations(needs_sync);
  CREATE INDEX IF NOT EXISTS idx_periodizations_deleted_at ON periodizations(deleted_at);

  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_periodization_id ON sessions(periodization_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
  CREATE INDEX IF NOT EXISTS idx_sessions_needs_sync ON sessions(needs_sync);
  CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON sessions(deleted_at);

  CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
  CREATE INDEX IF NOT EXISTS idx_exercises_session_id ON exercises(session_id);
  CREATE INDEX IF NOT EXISTS idx_exercises_needs_sync ON exercises(needs_sync);
  CREATE INDEX IF NOT EXISTS idx_exercises_deleted_at ON exercises(deleted_at);

  CREATE INDEX IF NOT EXISTS idx_sets_user_id ON sets(user_id);
  CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON sets(exercise_id);
  CREATE INDEX IF NOT EXISTS idx_sets_needs_sync ON sets(needs_sync);
  CREATE INDEX IF NOT EXISTS idx_sets_deleted_at ON sets(deleted_at);

  CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON sync_queue(user_id);
`;

export const DROP_TABLES_SQL = `
  DROP TABLE IF EXISTS sync_queue;
  DROP TABLE IF EXISTS sets;
  DROP TABLE IF EXISTS exercises;
  DROP TABLE IF EXISTS sessions;
  DROP TABLE IF EXISTS periodizations;
`;

