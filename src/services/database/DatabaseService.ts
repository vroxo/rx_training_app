import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
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
      console.log('✅ Database initialized successfully');
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
      `INSERT INTO sets (id, user_id, exercise_id, order_index, repetitions, weight, technique, set_type, rest_time, rir, rpe, notes, created_at, updated_at, needs_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
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
      console.log('✅ Database closed');
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();

