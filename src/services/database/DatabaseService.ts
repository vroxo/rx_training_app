import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, MIGRATIONS_SQL } from './schema';
import type { Periodization, Session, Exercise, Set, SyncQueue } from '../../models';

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private static instance: DatabaseService;

  private constructor() {}

  // Singleton pattern
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Initialize database
  public async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('rx_training.db');
      await this.createTables();
      await this.runMigrations();
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }

  // Create tables
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execAsync(CREATE_TABLES_SQL);
  }

  // Run migrations (add columns to existing databases)
  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      // Try to run migrations - will fail silently if columns already exist
      await this.db.execAsync(MIGRATIONS_SQL);
    } catch (error: any) {
      // Ignore "duplicate column" errors (means migrations already ran)
      if (!error?.message?.includes('duplicate column')) {
        console.error('⚠️ Migration warning:', error);
      }
      // Don't throw - allow app to continue even if migrations fail
    }
  }

  // Get database instance
  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('Database not initialized. Call init() first.');
    return this.db;
  }

  // ==============================================
  // PERIODIZATIONS
  // ==============================================

  public async getAllPeriodizations(userId: string): Promise<Periodization[]> {
    const db = this.getDb();
    const result = await db.getAllAsync<any>(
      'SELECT * FROM periodizations WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [userId]
    );
    return result.map(this.mapPeriodization);
  }

  public async getPeriodizationById(id: string): Promise<Periodization | null> {
    const db = this.getDb();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM periodizations WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return result ? this.mapPeriodization(result) : null;
  }

  public async createPeriodization(data: Omit<Periodization, 'createdAt' | 'updatedAt'>): Promise<Periodization> {
    const db = this.getDb();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `INSERT INTO periodizations (id, user_id, name, description, start_date, end_date, created_at, updated_at, needs_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        data.id,
        data.userId,
        data.name,
        data.description || null,
        data.startDate.toISOString(),
        data.endDate?.toISOString() || null,
        now,
        now,
      ]
    );

    const created = await this.getPeriodizationById(data.id);
    if (!created) throw new Error('Failed to create periodization');
    return created;
  }

  public async updatePeriodization(id: string, data: Partial<Periodization>): Promise<void> {
    const db = this.getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.startDate !== undefined) {
      fields.push('start_date = ?');
      values.push(data.startDate.toISOString());
    }
    if (data.endDate !== undefined) {
      fields.push('end_date = ?');
      values.push(data.endDate?.toISOString() || null);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    fields.push('needs_sync = 1');

    values.push(id);

    await db.runAsync(
      `UPDATE periodizations SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  public async deletePeriodization(id: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync(
      'UPDATE periodizations SET deleted_at = ?, needs_sync = 1 WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  // ==============================================
  // SESSIONS
  // ==============================================

  public async getSessionsByPeriodization(periodizationId: string): Promise<Session[]> {
    const db = this.getDb();
    const result = await db.getAllAsync<any>(
      'SELECT * FROM sessions WHERE periodization_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [periodizationId]
    );
    return result.map(this.mapSession);
  }

  public async getSessionById(id: string): Promise<Session | null> {
    const db = this.getDb();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM sessions WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return result ? this.mapSession(result) : null;
  }

  public async createSession(data: Omit<Session, 'createdAt' | 'updatedAt'>): Promise<Session> {
    const db = this.getDb();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO sessions (id, user_id, periodization_id, name, scheduled_at, completed_at, status, notes, created_at, updated_at, needs_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        data.id,
        data.userId,
        data.periodizationId,
        data.name,
        data.scheduledAt?.toISOString() || null,
        data.completedAt?.toISOString() || null,
        data.status,
        data.notes || null,
        now,
        now,
      ]
    );

    const created = await this.getSessionById(data.id);
    if (!created) throw new Error('Failed to create session');
    return created;
  }

  public async updateSession(id: string, data: Partial<Session>): Promise<void> {
    const db = this.getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.scheduledAt !== undefined) {
      fields.push('scheduled_at = ?');
      values.push(data.scheduledAt?.toISOString() || null);
    }
    if (data.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(data.completedAt?.toISOString() || null);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    fields.push('needs_sync = 1');

    values.push(id);

    await db.runAsync(
      `UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  public async deleteSession(id: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync(
      'UPDATE sessions SET deleted_at = ?, needs_sync = 1 WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  // ==============================================
  // EXERCISES
  // ==============================================

  public async getExercisesBySession(sessionId: string): Promise<Exercise[]> {
    const db = this.getDb();
    const result = await db.getAllAsync<any>(
      'SELECT * FROM exercises WHERE session_id = ? AND deleted_at IS NULL ORDER BY order_index ASC',
      [sessionId]
    );
    return result.map(this.mapExercise);
  }

  public async getExerciseById(id: string): Promise<Exercise | null> {
    const db = this.getDb();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM exercises WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return result ? this.mapExercise(result) : null;
  }

  public async createExercise(data: Omit<Exercise, 'createdAt' | 'updatedAt'>): Promise<Exercise> {
    const db = this.getDb();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO exercises (id, user_id, session_id, name, muscle_group, equipment, notes, order_index, created_at, updated_at, needs_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        data.id,
        data.userId,
        data.sessionId,
        data.name,
        data.muscleGroup || null,
        data.equipment || null,
        data.notes || null,
        data.orderIndex,
        now,
        now,
      ]
    );

    const created = await this.getExerciseById(data.id);
    if (!created) throw new Error('Failed to create exercise');
    return created;
  }

  public async updateExercise(id: string, data: Partial<Exercise>): Promise<void> {
    const db = this.getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.muscleGroup !== undefined) {
      fields.push('muscle_group = ?');
      values.push(data.muscleGroup);
    }
    if (data.equipment !== undefined) {
      fields.push('equipment = ?');
      values.push(data.equipment);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }
    if (data.orderIndex !== undefined) {
      fields.push('order_index = ?');
      values.push(data.orderIndex);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    fields.push('needs_sync = 1');

    values.push(id);

    await db.runAsync(
      `UPDATE exercises SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  public async deleteExercise(id: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync(
      'UPDATE exercises SET deleted_at = ?, needs_sync = 1 WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  // ==============================================
  // SETS
  // ==============================================

  public async getSetsByExercise(exerciseId: string): Promise<Set[]> {
    const db = this.getDb();
    const result = await db.getAllAsync<any>(
      'SELECT * FROM sets WHERE exercise_id = ? AND deleted_at IS NULL ORDER BY order_index ASC',
      [exerciseId]
    );
    return result.map(this.mapSet);
  }

  public async getSetById(id: string): Promise<Set | null> {
    const db = this.getDb();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM sets WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return result ? this.mapSet(result) : null;
  }

  public async createSet(data: Omit<Set, 'createdAt' | 'updatedAt'>): Promise<Set> {
    const db = this.getDb();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO sets (id, user_id, exercise_id, order_index, repetitions, weight, technique, set_type, rest_time, rir, rpe, notes, drop_set_weights, drop_set_reps, rest_pause_duration, rest_pause_reps, cluster_reps, cluster_rest_duration, created_at, updated_at, needs_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        data.id,
        data.userId,
        data.exerciseId,
        data.orderIndex,
        data.repetitions,
        data.weight,
        data.technique || null,
        data.setType || null,
        data.restTime || null,
        data.rir || null,
        data.rpe || null,
        data.notes || null,
        data.dropSetWeights ? JSON.stringify(data.dropSetWeights) : null,
        data.dropSetReps ? JSON.stringify(data.dropSetReps) : null,
        data.restPauseDuration || null,
        data.restPauseReps ? JSON.stringify(data.restPauseReps) : null,
        data.clusterReps || null,
        data.clusterRestDuration || null,
        now,
        now,
      ]
    );

    const created = await this.getSetById(data.id);
    if (!created) throw new Error('Failed to create set');
    return created;
  }

  public async updateSet(id: string, data: Partial<Set>): Promise<void> {
    const db = this.getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.orderIndex !== undefined) {
      fields.push('order_index = ?');
      values.push(data.orderIndex);
    }
    if (data.repetitions !== undefined) {
      fields.push('repetitions = ?');
      values.push(data.repetitions);
    }
    if (data.weight !== undefined) {
      fields.push('weight = ?');
      values.push(data.weight);
    }
    if (data.technique !== undefined) {
      fields.push('technique = ?');
      values.push(data.technique);
    }
    if (data.setType !== undefined) {
      fields.push('set_type = ?');
      values.push(data.setType);
    }
    if (data.restTime !== undefined) {
      fields.push('rest_time = ?');
      values.push(data.restTime);
    }
    if (data.rir !== undefined) {
      fields.push('rir = ?');
      values.push(data.rir);
    }
    if (data.rpe !== undefined) {
      fields.push('rpe = ?');
      values.push(data.rpe);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }
    if (data.dropSetWeights !== undefined) {
      fields.push('drop_set_weights = ?');
      values.push(data.dropSetWeights ? JSON.stringify(data.dropSetWeights) : null);
    }
    if (data.dropSetReps !== undefined) {
      fields.push('drop_set_reps = ?');
      values.push(data.dropSetReps ? JSON.stringify(data.dropSetReps) : null);
    }
    if (data.restPauseDuration !== undefined) {
      fields.push('rest_pause_duration = ?');
      values.push(data.restPauseDuration);
    }
    if (data.restPauseReps !== undefined) {
      fields.push('rest_pause_reps = ?');
      values.push(data.restPauseReps ? JSON.stringify(data.restPauseReps) : null);
    }
    if (data.clusterReps !== undefined) {
      fields.push('cluster_reps = ?');
      values.push(data.clusterReps);
    }
    if (data.clusterRestDuration !== undefined) {
      fields.push('cluster_rest_duration = ?');
      values.push(data.clusterRestDuration);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    fields.push('needs_sync = 1');

    values.push(id);

    await db.runAsync(
      `UPDATE sets SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  public async deleteSet(id: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync(
      'UPDATE sets SET deleted_at = ?, needs_sync = 1 WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  // ==============================================
  // DUPLICATION METHODS
  // ==============================================

  /**
   * Duplicates a set with a new ID
   * @param setId - ID of the set to duplicate
   * @returns The newly created set
   */
  public async duplicateSet(setId: string): Promise<Set> {
    const originalSet = await this.getSetById(setId);
    if (!originalSet) {
      throw new Error(`Set with id ${setId} not found`);
    }

    // Generate new ID and get the current max order_index
    const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sets = await this.getSetsByExercise(originalSet.exerciseId);
    const maxOrderIndex = Math.max(...sets.map(s => s.orderIndex), -1);

    // Create duplicate with incremented order_index
    const duplicateData: Omit<Set, 'createdAt' | 'updatedAt'> = {
      id: newId,
      userId: originalSet.userId,
      exerciseId: originalSet.exerciseId,
      orderIndex: maxOrderIndex + 1,
      repetitions: originalSet.repetitions,
      weight: originalSet.weight,
      technique: originalSet.technique,
      setType: originalSet.setType,
      restTime: originalSet.restTime,
      rir: originalSet.rir,
      rpe: originalSet.rpe,
      notes: originalSet.notes,
      dropSetWeights: originalSet.dropSetWeights,
      dropSetReps: originalSet.dropSetReps,
      restPauseDuration: originalSet.restPauseDuration,
      clusterReps: originalSet.clusterReps,
      clusterRestDuration: originalSet.clusterRestDuration,
      needsSync: true,
    };

    return await this.createSet(duplicateData);
  }

  /**
   * Duplicates an exercise with all its sets
   * @param exerciseId - ID of the exercise to duplicate
   * @returns The newly created exercise
   */
  public async duplicateExercise(exerciseId: string): Promise<Exercise> {
    const originalExercise = await this.getExerciseById(exerciseId);
    if (!originalExercise) {
      throw new Error(`Exercise with id ${exerciseId} not found`);
    }

    // Get all sets from the original exercise
    const originalSets = await this.getSetsByExercise(exerciseId);

    // Generate new ID and get the current max order_index
    const newExerciseId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const exercises = await this.getExercisesBySession(originalExercise.sessionId);
    const maxOrderIndex = Math.max(...exercises.map(e => e.orderIndex), -1);

    // Create duplicate exercise with incremented order_index
    const duplicateExerciseData = {
      id: newExerciseId,
      userId: originalExercise.userId,
      sessionId: originalExercise.sessionId,
      name: `${originalExercise.name} (cópia)`,
      muscleGroup: originalExercise.muscleGroup,
      equipmentType: originalExercise.equipmentType,
      notes: originalExercise.notes,
      orderIndex: maxOrderIndex + 1,
      conjugatedGroup: originalExercise.conjugatedGroup,
      conjugatedOrder: originalExercise.conjugatedOrder,
      completedAt: undefined, // Reset completion status
      needsSync: true,
    };

    const newExercise = await this.createExercise(duplicateExerciseData);

    // Duplicate all sets
    for (const originalSet of originalSets) {
      const newSetId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duplicateSetData = {
        id: newSetId,
        userId: originalSet.userId,
        exerciseId: newExerciseId,
        orderIndex: originalSet.orderIndex,
        repetitions: originalSet.repetitions,
        weight: originalSet.weight,
        technique: originalSet.technique,
        setType: originalSet.setType,
        restTime: originalSet.restTime,
        rir: originalSet.rir,
        rpe: originalSet.rpe,
        notes: originalSet.notes,
        dropSetWeights: originalSet.dropSetWeights,
        dropSetReps: originalSet.dropSetReps,
        restPauseDuration: originalSet.restPauseDuration,
        clusterReps: originalSet.clusterReps,
        clusterRestDuration: originalSet.clusterRestDuration,
        needsSync: true,
      };
      await this.createSet(duplicateSetData);
    }

    return newExercise;
  }

  /**
   * Duplicates a session with all its exercises and sets
   * @param sessionId - ID of the session to duplicate
   * @returns The newly created session
   */
  public async duplicateSession(sessionId: string): Promise<Session> {
    const originalSession = await this.getSessionById(sessionId);
    if (!originalSession) {
      throw new Error(`Session with id ${sessionId} not found`);
    }

    // Get all exercises from the original session
    const originalExercises = await this.getExercisesBySession(sessionId);

    // Generate new session ID
    const newSessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create duplicate session (without "(cópia)" in the name)
    const duplicateSessionData = {
      id: newSessionId,
      userId: originalSession.userId,
      periodizationId: originalSession.periodizationId,
      name: originalSession.name, // Keep original name
      scheduledAt: originalSession.scheduledAt,
      status: 'planned' as const, // Reset status to planned
      completedAt: undefined, // Reset completion
      notes: originalSession.notes,
      needsSync: true,
    };

    const newSession = await this.createSession(duplicateSessionData);

    // Duplicate all exercises and their sets
    for (const originalExercise of originalExercises) {
      const newExerciseId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duplicateExerciseData = {
        id: newExerciseId,
        userId: originalExercise.userId,
        sessionId: newSessionId,
        name: originalExercise.name,
        muscleGroup: originalExercise.muscleGroup,
        equipmentType: originalExercise.equipmentType,
        notes: originalExercise.notes,
        orderIndex: originalExercise.orderIndex,
        conjugatedGroup: originalExercise.conjugatedGroup,
        conjugatedOrder: originalExercise.conjugatedOrder,
        completedAt: undefined, // Reset completion
        needsSync: true,
      };
      await this.createExercise(duplicateExerciseData);

      // Get and duplicate all sets for this exercise
      const originalSets = await this.getSetsByExercise(originalExercise.id);
      for (const originalSet of originalSets) {
        const newSetId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const duplicateSetData = {
          id: newSetId,
          userId: originalSet.userId,
          exerciseId: newExerciseId,
          orderIndex: originalSet.orderIndex,
          repetitions: originalSet.repetitions,
          weight: originalSet.weight,
          technique: originalSet.technique,
          setType: originalSet.setType,
          restTime: originalSet.restTime,
          rir: originalSet.rir,
          rpe: originalSet.rpe,
          notes: originalSet.notes,
          dropSetWeights: originalSet.dropSetWeights,
          dropSetReps: originalSet.dropSetReps,
          restPauseDuration: originalSet.restPauseDuration,
          clusterReps: originalSet.clusterReps,
          clusterRestDuration: originalSet.clusterRestDuration,
          needsSync: true,
        };
        await this.createSet(duplicateSetData);
      }
    }

    return newSession;
  }

  // ==============================================
  // MAPPER FUNCTIONS
  // ==============================================

  private mapPeriodization(row: any): Periodization {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      startDate: new Date(row.start_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      syncedAt: row.synced_at ? new Date(row.synced_at) : undefined,
      needsSync: row.needs_sync === 1,
    };
  }

  private mapSession(row: any): Session {
    return {
      id: row.id,
      userId: row.user_id,
      periodizationId: row.periodization_id,
      name: row.name,
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      status: row.status,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      syncedAt: row.synced_at ? new Date(row.synced_at) : undefined,
      needsSync: row.needs_sync === 1,
    };
  }

  private mapExercise(row: any): Exercise {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      name: row.name,
      muscleGroup: row.muscle_group,
      equipment: row.equipment,
      notes: row.notes,
      orderIndex: row.order_index,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      syncedAt: row.synced_at ? new Date(row.synced_at) : undefined,
      needsSync: row.needs_sync === 1,
    };
  }

  private mapSet(row: any): Set {
    return {
      id: row.id,
      userId: row.user_id,
      exerciseId: row.exercise_id,
      orderIndex: row.order_index,
      repetitions: row.repetitions,
      weight: row.weight,
      technique: row.technique,
      setType: row.set_type,
      restTime: row.rest_time,
      rir: row.rir,
      rpe: row.rpe,
      notes: row.notes,
      dropSetWeights: row.drop_set_weights ? JSON.parse(row.drop_set_weights) : undefined,
      dropSetReps: row.drop_set_reps ? JSON.parse(row.drop_set_reps) : undefined,
      restPauseDuration: row.rest_pause_duration,
      restPauseReps: row.rest_pause_reps ? JSON.parse(row.rest_pause_reps) : undefined,
      clusterReps: row.cluster_reps,
      clusterRestDuration: row.cluster_rest_duration,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      syncedAt: row.synced_at ? new Date(row.synced_at) : undefined,
      needsSync: row.needs_sync === 1,
    };
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();

