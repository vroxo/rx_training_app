import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { Periodization, Session, Exercise, Set } from '../../models';

// Storage keys
const KEYS = {
  PERIODIZATIONS: '@rx_training:periodizations',
  SESSIONS: '@rx_training:sessions',
  EXERCISES: '@rx_training:exercises',
  SETS: '@rx_training:sets',
};

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  private generateId(): string {
    return uuidv4();
  }

  // Singleton pattern
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Initialize storage (no-op for AsyncStorage)
  public async init(): Promise<void> {
  }

  // ==============================================
  // PERIODIZATIONS
  // ==============================================

  public async getAllPeriodizations(userId: string): Promise<Periodization[]> {
    const data = await this.getAll<Periodization>(KEYS.PERIODIZATIONS);
    return data
      .filter(p => p.userId === userId && !p.deletedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get ALL periodizations including deleted (for sync)
  public async getAllPeriodizationsIncludingDeleted(userId: string): Promise<Periodization[]> {
    const data = await this.getAll<Periodization>(KEYS.PERIODIZATIONS);
    return data
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Alias for consistency
  public async getPeriodizationsByUser(userId: string): Promise<Periodization[]> {
    return this.getAllPeriodizations(userId);
  }

  public async getPeriodizationById(id: string): Promise<Periodization | null> {
    const all = await this.getAll<Periodization>(KEYS.PERIODIZATIONS);
    return all.find(p => p.id === id && !p.deletedAt) || null;
  }

  /**
   * Get periodization by ID, including soft-deleted ones (for sync purposes)
   */
  public async getPeriodizationByIdIncludingDeleted(id: string): Promise<Periodization | null> {
    const all = await this.getAll<Periodization>(KEYS.PERIODIZATIONS);
    return all.find(p => p.id === id) || null;
  }

  public async createPeriodization(data: Omit<Periodization, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Periodization> {
    const now = new Date();
    const periodization: Periodization = {
      ...data,
      id: data.id || this.generateId(),
      createdAt: now,
      updatedAt: now,
      needsSync: data.needsSync !== undefined ? data.needsSync : true,
    };

    await this.add(KEYS.PERIODIZATIONS, periodization);
    return periodization;
  }

  public async updatePeriodization(id: string, updates: Partial<Periodization>): Promise<void> {
    await this.update<Periodization>(KEYS.PERIODIZATIONS, id, {
      ...updates,
      updatedAt: new Date(),
      needsSync: updates.needsSync !== undefined ? updates.needsSync : true,
    });
  }

  public async deletePeriodization(id: string): Promise<void> {
    const deletedAt = new Date();
      id,
      deletedAt,
      deletedAtISO: deletedAt.toISOString(),
    });
    
    await this.update<Periodization>(KEYS.PERIODIZATIONS, id, {
      deletedAt,
      needsSync: true,
    } as any);
    
    // Verify the update
    const updated = await this.getPeriodizationByIdIncludingDeleted(id);
      id: updated?.id,
      name: updated?.name,
      deletedAt: updated?.deletedAt,
      needsSync: updated?.needsSync,
    });
  }

  // ==============================================
  // SESSIONS
  // ==============================================

  public async getSessionsByPeriodization(periodizationId: string): Promise<Session[]> {
    const data = await this.getAll<Session>(KEYS.SESSIONS);
    return data
      .filter(s => s.periodizationId === periodizationId && !s.deletedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get ALL sessions including deleted (for sync)
  public async getSessionsByPeriodizationIncludingDeleted(periodizationId: string): Promise<Session[]> {
    const data = await this.getAll<Session>(KEYS.SESSIONS);
    return data
      .filter(s => s.periodizationId === periodizationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getSessionById(id: string): Promise<Session | null> {
    const all = await this.getAll<Session>(KEYS.SESSIONS);
    return all.find(s => s.id === id && !s.deletedAt) || null;
  }

  /**
   * Get session by ID, including soft-deleted ones (for sync purposes)
   */
  public async getSessionByIdIncludingDeleted(id: string): Promise<Session | null> {
    const all = await this.getAll<Session>(KEYS.SESSIONS);
    return all.find(s => s.id === id) || null;
  }

  public async createSession(data: Omit<Session, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Session> {
    const now = new Date();
    const session: Session = {
      ...data,
      id: data.id || this.generateId(),
      createdAt: now,
      updatedAt: now,
      needsSync: data.needsSync !== undefined ? data.needsSync : true,
    };

    await this.add(KEYS.SESSIONS, session);
    return session;
  }

  public async updateSession(id: string, updates: Partial<Session>): Promise<void> {
    await this.update<Session>(KEYS.SESSIONS, id, {
      ...updates,
      updatedAt: new Date(),
      needsSync: updates.needsSync !== undefined ? updates.needsSync : true,
    });
  }

  public async deleteSession(id: string): Promise<void> {
    await this.update<Session>(KEYS.SESSIONS, id, {
      deletedAt: new Date(),
      needsSync: true,
    } as any);
  }

  // ==============================================
  // EXERCISES
  // ==============================================

  public async getExercisesBySession(sessionId: string): Promise<Exercise[]> {
    const data = await this.getAll<Exercise>(KEYS.EXERCISES);
    const filtered = data
      .filter(e => e.sessionId === sessionId && !e.deletedAt)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    
    // Check for duplicate IDs
    const ids = filtered.map(e => e.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.error('⚠️ [STORAGE] Found duplicate exercise IDs for session:', sessionId);
      console.error('IDs:', ids);
      console.error('Duplicate exercises:', filtered.filter((e, i, arr) => 
        arr.findIndex(ex => ex.id === e.id) !== i
      ));
    }
    
    return filtered;
  }

  // Get ALL exercises including deleted (for sync)
  public async getExercisesBySessionIncludingDeleted(sessionId: string): Promise<Exercise[]> {
    const data = await this.getAll<Exercise>(KEYS.EXERCISES);
    return data
      .filter(e => e.sessionId === sessionId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async getExerciseById(id: string): Promise<Exercise | null> {
    const all = await this.getAll<Exercise>(KEYS.EXERCISES);
    return all.find(e => e.id === id && !e.deletedAt) || null;
  }

  /**
   * Get exercise by ID, including soft-deleted ones (for sync purposes)
   */
  public async getExerciseByIdIncludingDeleted(id: string): Promise<Exercise | null> {
    const all = await this.getAll<Exercise>(KEYS.EXERCISES);
    return all.find(e => e.id === id) || null;
  }

  public async createExercise(data: Omit<Exercise, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Exercise> {
    const now = new Date();
    const exercise: Exercise = {
      ...data,
      id: data.id || this.generateId(),
      createdAt: now,
      updatedAt: now,
      needsSync: data.needsSync !== undefined ? data.needsSync : true,
    };

    await this.add(KEYS.EXERCISES, exercise);
    return exercise;
  }

  public async updateExercise(id: string, updates: Partial<Exercise>): Promise<void> {
    await this.update<Exercise>(KEYS.EXERCISES, id, {
      ...updates,
      updatedAt: new Date(),
      needsSync: updates.needsSync !== undefined ? updates.needsSync : true,
    });
  }

  public async deleteExercise(id: string): Promise<void> {
    await this.update<Exercise>(KEYS.EXERCISES, id, {
      deletedAt: new Date(),
      needsSync: true,
    } as any);
  }

  // ==============================================
  // SETS
  // ==============================================

  public async getSetsByExercise(exerciseId: string): Promise<Set[]> {
    const data = await this.getAll<Set>(KEYS.SETS);
    return data
      .filter(s => s.exerciseId === exerciseId && !s.deletedAt)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  // Get ALL sets including deleted (for sync)
  public async getSetsByExerciseIncludingDeleted(exerciseId: string): Promise<Set[]> {
    const data = await this.getAll<Set>(KEYS.SETS);
    return data
      .filter(s => s.exerciseId === exerciseId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async getSetById(id: string): Promise<Set | null> {
    const all = await this.getAll<Set>(KEYS.SETS);
    return all.find(s => s.id === id && !s.deletedAt) || null;
  }

  /**
   * Get set by ID, including soft-deleted ones (for sync purposes)
   */
  public async getSetByIdIncludingDeleted(id: string): Promise<Set | null> {
    const all = await this.getAll<Set>(KEYS.SETS);
    return all.find(s => s.id === id) || null;
  }

  public async createSet(data: Omit<Set, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Set> {
    const now = new Date();
    const set: Set = {
      ...data,
      id: data.id || this.generateId(),
      createdAt: now,
      updatedAt: now,
      needsSync: data.needsSync !== undefined ? data.needsSync : true,
    };

    await this.add(KEYS.SETS, set);
    return set;
  }

  public async updateSet(id: string, updates: Partial<Set>): Promise<void> {
    await this.update<Set>(KEYS.SETS, id, {
      ...updates,
      updatedAt: new Date(),
      needsSync: updates.needsSync !== undefined ? updates.needsSync : true,
    });
  }

  public async deleteSet(id: string): Promise<void> {
    await this.update<Set>(KEYS.SETS, id, {
      deletedAt: new Date(),
      needsSync: true,
    } as any);
  }

  // ==============================================
  // HELPER METHODS
  // ==============================================

  private async getAll<T extends { id: string }>(key: string): Promise<T[]> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      return parsed.map((item: any) => this.deserializeDates(item));
    } catch (error) {
      console.error(`Error getting all from ${key}:`, error);
      return [];
    }
  }

  private async add<T extends { id: string }>(key: string, item: T): Promise<void> {
    try {
      const all = await this.getAll<T>(key);
      
      // Check if item with this ID already exists
      const existingIndex = all.findIndex(existing => existing.id === item.id);
      if (existingIndex !== -1) {
        all[existingIndex] = item;
      } else {
        all.push(item);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(all));
    } catch (error) {
      console.error(`Error adding to ${key}:`, error);
      throw error;
    }
  }

  private async update<T extends { id: string }>(
    key: string,
    id: string,
    updates: Partial<T>
  ): Promise<void> {
    try {
      const all = await this.getAll<T>(key);
      const index = all.findIndex(item => item.id === id);
      
      if (index === -1) {
        throw new Error(`Item with id ${id} not found in ${key}`);
      }

      all[index] = { ...all[index], ...updates };
      await AsyncStorage.setItem(key, JSON.stringify(all));
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      throw error;
    }
  }

  private deserializeDates(obj: any): any {
    const dateFields = ['createdAt', 'updatedAt', 'deletedAt', 'syncedAt', 'startDate', 'endDate', 'scheduledAt', 'completedAt'];
    
    const result = { ...obj };
    for (const field of dateFields) {
      if (result[field]) {
        result[field] = new Date(result[field]);
      }
    }
    
    return result;
  }

  // Clear all data (useful for logout)
  public async clearAll(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.PERIODIZATIONS),
      AsyncStorage.removeItem(KEYS.SESSIONS),
      AsyncStorage.removeItem(KEYS.EXERCISES),
      AsyncStorage.removeItem(KEYS.SETS),
    ]);
  }

  // ==============================================
  // DUPLICATION METHODS
  // ==============================================

  /**
   * Duplicates a set with a new ID
   */
  public async duplicateSet(setId: string): Promise<Set> {
    const originalSet = await this.getSetById(setId);
    if (!originalSet) {
      throw new Error(`Set with id ${setId} not found`);
    }

    // Get all sets from the exercise to determine order
    const allSets = await this.getSetsByExercise(originalSet.exerciseId);
    const maxOrderIndex = Math.max(...allSets.map(s => s.orderIndex), -1);

    // Create duplicate with incremented order_index
    // Explicitly omit fields that should not be copied
    const { id: _omitId, createdAt: _omitCreatedAt, updatedAt: _omitUpdatedAt, syncedAt: _omitSyncedAt, deletedAt: _omitDeletedAt4, ...setData } = originalSet;
    
    // Ensure no 'id' field is accidentally passed
    const duplicateSet: any = {
      ...setData,
      orderIndex: maxOrderIndex + 1,
      needsSync: true,
    };
    delete duplicateSet.id; // Force remove id if it exists

    return await this.createSet(duplicateSet);
  }

  /**
   * Duplicates an exercise with all its sets
   */
  public async duplicateExercise(exerciseId: string): Promise<Exercise> {
    const originalExercise = await this.getExerciseById(exerciseId);
    if (!originalExercise) {
      throw new Error(`Exercise with id ${exerciseId} not found`);
    }

    // Get all sets from the original exercise
    const originalSets = await this.getSetsByExercise(exerciseId);

    // Get all exercises from the session to determine order
    const allExercises = await this.getExercisesBySession(originalExercise.sessionId);
    const maxOrderIndex = Math.max(...allExercises.map(e => e.orderIndex), -1);

    // Create duplicate exercise with incremented order_index
    // Explicitly omit fields that should not be copied
    const { id: _omitExId, createdAt: _omitExCreatedAt, updatedAt: _omitExUpdatedAt, syncedAt: _omitExSyncedAt, deletedAt: _omitDeletedAt2, ...exerciseData } = originalExercise;
    
    // Ensure no 'id' field is accidentally passed
    const duplicateExercise: any = {
      ...exerciseData,
      name: `${originalExercise.name} (cópia)`,
      orderIndex: maxOrderIndex + 1,
      completedAt: undefined, // Reset completion status
      needsSync: true,
    };
    delete duplicateExercise.id; // Force remove id if it exists

    const newExercise = await this.createExercise(duplicateExercise);

    // Duplicate all sets
    for (const originalSet of originalSets) {
      // Explicitly omit fields that should not be copied
      const { id: _omitSetId, createdAt: _omitSetCreatedAt, updatedAt: _omitSetUpdatedAt, syncedAt: _omitSetSyncedAt, deletedAt: _omitDeletedAt3, ...setData } = originalSet;
      
      // Ensure no 'id' field is accidentally passed
      const duplicateSet: any = {
        ...setData,
        exerciseId: newExercise.id,
        needsSync: true,
      };
      delete duplicateSet.id; // Force remove id if it exists
      
      await this.createSet(duplicateSet);
    }

    return newExercise;
  }

  /**
   * Duplicates a session with all its exercises and sets
   */
  public async duplicateSession(sessionId: string): Promise<Session> {
    const originalSession = await this.getSessionById(sessionId);
    if (!originalSession) {
      throw new Error(`Session with id ${sessionId} not found`);
    }

    // Get all exercises from the original session
    const originalExercises = await this.getExercisesBySession(sessionId);

    // Create duplicate session (without "(cópia)" in the name)
    // Explicitly omit fields that should not be copied
    const { id: _omitId, createdAt: _omitCreatedAt, updatedAt: _omitUpdatedAt, syncedAt: _omitSyncedAt, ...sessionData } = originalSession;
    
    const duplicateSession = {
      ...sessionData,
      name: originalSession.name, // Keep original name
      status: 'planned' as const, // Reset status to planned
      completedAt: undefined, // Reset completion
      needsSync: true,
    };

    const newSession = await this.createSession(duplicateSession);

    // Duplicate all exercises and their sets
    for (const originalExercise of originalExercises) {
      // Explicitly omit fields that should not be copied
      const { id: _omitExId, createdAt: _omitExCreatedAt, updatedAt: _omitExUpdatedAt, syncedAt: _omitExSyncedAt, deletedAt: _omitDeletedAt, ...exerciseData } = originalExercise;
      
      // Ensure no 'id' field is accidentally passed
      const duplicateExercise: any = {
        ...exerciseData,
        sessionId: newSession.id,
        completedAt: undefined, // Reset completion
        needsSync: true,
      };
      delete duplicateExercise.id; // Force remove id if it exists
      
      const newExercise = await this.createExercise(duplicateExercise);

      // Get and duplicate all sets for this exercise
      const originalSets = await this.getSetsByExercise(originalExercise.id);
      
      for (const originalSet of originalSets) {
        // Explicitly omit fields that should not be copied
        const { id: _omitSetId, createdAt: _omitSetCreatedAt, updatedAt: _omitSetUpdatedAt, syncedAt: _omitSetSyncedAt, deletedAt: _omitDeletedAt, ...setData } = originalSet;
        
        // Ensure no 'id' field is accidentally passed
        const duplicateSet: any = {
          ...setData,
          exerciseId: newExercise.id,
          needsSync: true,
        };
        delete duplicateSet.id; // Force remove id if it exists
        
        const newSet = await this.createSet(duplicateSet);
      }
    }

    return newSession;
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();

