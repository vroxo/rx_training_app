/**
 * Tests for DatabaseService - Sets CRUD
 */

jest.mock('expo-sqlite');

import { _resetMockTables } from 'expo-sqlite';
import { DatabaseService } from '../DatabaseService';
import {
  createTestDatabase,
  cleanupDatabase,
  createTestPeriodization,
  createTestSession,
  createTestExercise,
  createTestSet,
} from './testHelpers';

describe('DatabaseService - Sets', () => {
  let db: DatabaseService;
  const TEST_USER_ID = 'test-user-id';
  let testExerciseId: string;

  beforeEach(async () => {
    _resetMockTables();
    jest.clearAllMocks();
    
    db = await createTestDatabase();
    
    // Create test hierarchy for foreign keys
    const periodization = createTestPeriodization();
    await db.createPeriodization(periodization);
    
    const session = createTestSession(periodization.id);
    await db.createSession(session);
    
    const exercise = createTestExercise(session.id);
    await db.createExercise(exercise);
    testExerciseId = exercise.id;
  });

  afterEach(async () => {
    try {
      await cleanupDatabase(db);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('createSet', () => {
    it('should create a set successfully', async () => {
      const data = createTestSet(testExerciseId);

      const result = await db.createSet(data);

      expect(result).toBeDefined();
      expect(result.id).toBe(data.id);
      expect(result.exerciseId).toBe(testExerciseId);
      expect(result.repetitions).toBe(10);
      expect(result.weight).toBe(80);
      expect(result.orderIndex).toBe(0);
      expect(result.needsSync).toBe(true);
    });

    it('should create set with all basic fields', async () => {
      const data = createTestSet(testExerciseId, {
        repetitions: 12,
        weight: 100,
        restTime: 120,
        rir: 3,
        rpe: 7,
        notes: 'Good form',
      });

      const result = await db.createSet(data);

      expect(result.repetitions).toBe(12);
      expect(result.weight).toBe(100);
      expect(result.restTime).toBe(120);
      expect(result.rir).toBe(3);
      expect(result.rpe).toBe(7);
      expect(result.notes).toBe('Good form');
    });

    it('should create set with null optional fields', async () => {
      const data = createTestSet(testExerciseId, {
        restTime: undefined,
        rir: undefined,
        rpe: undefined,
        notes: undefined,
      });

      const result = await db.createSet(data);

      expect(result.restTime).toBeFalsy();
      expect(result.rir).toBeFalsy();
      expect(result.rpe).toBeFalsy();
      expect(result.notes).toBeFalsy();
    });
  });

  describe('getSetById', () => {
    it('should retrieve a set by id', async () => {
      const data = createTestSet(testExerciseId);
      await db.createSet(data);

      const result = await db.getSetById(data.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(data.id);
      expect(result!.exerciseId).toBe(testExerciseId);
    });

    it('should return null for non-existent id', async () => {
      const result = await db.getSetById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return soft-deleted sets', async () => {
      const data = createTestSet(testExerciseId);
      await db.createSet(data);
      await db.deleteSet(data.id);

      const result = await db.getSetById(data.id);

      expect(result).toBeNull();
    });
  });

  describe('getSetsByExercise', () => {
    it('should return empty array when no sets exist', async () => {
      const result = await db.getSetsByExercise(testExerciseId);

      expect(result).toEqual([]);
    });

    it('should retrieve all sets for an exercise', async () => {
      const data1 = createTestSet(testExerciseId, { orderIndex: 0, weight: 80 });
      const data2 = createTestSet(testExerciseId, { orderIndex: 1, weight: 90 });
      
      await db.createSet(data1);
      await db.createSet(data2);

      const result = await db.getSetsByExercise(testExerciseId);

      expect(result).toHaveLength(2);
    });

    it('should order sets by order_index ASC', async () => {
      const data1 = createTestSet(testExerciseId, { orderIndex: 2, weight: 60 });
      const data2 = createTestSet(testExerciseId, { orderIndex: 0, weight: 80 });
      const data3 = createTestSet(testExerciseId, { orderIndex: 1, weight: 70 });
      
      await db.createSet(data1);
      await db.createSet(data2);
      await db.createSet(data3);

      const result = await db.getSetsByExercise(testExerciseId);

      expect(result[0].weight).toBe(80);
      expect(result[1].weight).toBe(70);
      expect(result[2].weight).toBe(60);
    });

    it('should not return sets from other exercises', async () => {
      const periodization = createTestPeriodization();
      await db.createPeriodization(periodization);
      const session = createTestSession(periodization.id);
      await db.createSession(session);
      const otherExercise = createTestExercise(session.id);
      await db.createExercise(otherExercise);

      const set1 = createTestSet(testExerciseId, { weight: 80 });
      const set2 = createTestSet(otherExercise.id, { weight: 90 });
      
      await db.createSet(set1);
      await db.createSet(set2);

      const result = await db.getSetsByExercise(testExerciseId);

      expect(result).toHaveLength(1);
      expect(result[0].weight).toBe(80);
    });

    it('should not return soft-deleted sets', async () => {
      const data1 = createTestSet(testExerciseId, { weight: 80 });
      const data2 = createTestSet(testExerciseId, { weight: 90 });
      
      await db.createSet(data1);
      await db.createSet(data2);
      await db.deleteSet(data2.id);

      const result = await db.getSetsByExercise(testExerciseId);

      expect(result).toHaveLength(1);
      expect(result[0].weight).toBe(80);
    });
  });

  describe('updateSet', () => {
    it('should update set weight', async () => {
      const data = createTestSet(testExerciseId, { weight: 80 });
      await db.createSet(data);

      await db.updateSet(data.id, { weight: 100 });
      const result = await db.getSetById(data.id);

      expect(result!.weight).toBe(100);
    });

    it('should update set repetitions', async () => {
      const data = createTestSet(testExerciseId, { repetitions: 10 });
      await db.createSet(data);

      await db.updateSet(data.id, { repetitions: 12 });
      const result = await db.getSetById(data.id);

      expect(result!.repetitions).toBe(12);
    });

    it('should update RIR and RPE', async () => {
      const data = createTestSet(testExerciseId);
      await db.createSet(data);

      await db.updateSet(data.id, { rir: 1, rpe: 9 });
      const result = await db.getSetById(data.id);

      expect(result!.rir).toBe(1);
      expect(result!.rpe).toBe(9);
    });

    it('should update multiple fields at once', async () => {
      const data = createTestSet(testExerciseId);
      await db.createSet(data);

      await db.updateSet(data.id, {
        weight: 90,
        repetitions: 8,
        rir: 2,
        notes: 'Updated notes',
      });
      const result = await db.getSetById(data.id);

      expect(result!.weight).toBe(90);
      expect(result!.repetitions).toBe(8);
      expect(result!.rir).toBe(2);
      expect(result!.notes).toBe('Updated notes');
    });

    it('should set needs_sync to true on update', async () => {
      const data = createTestSet(testExerciseId);
      await db.createSet(data);

      await db.updateSet(data.id, { weight: 100 });
      const result = await db.getSetById(data.id);

      expect(result!.needsSync).toBe(true);
    });
  });

  describe('deleteSet', () => {
    it('should soft delete a set', async () => {
      const data = createTestSet(testExerciseId);
      await db.createSet(data);

      await db.deleteSet(data.id);
      const result = await db.getSetById(data.id);

      expect(result).toBeNull();
    });

    it('should not affect other sets', async () => {
      const data1 = createTestSet(testExerciseId, { orderIndex: 0, weight: 80 });
      const data2 = createTestSet(testExerciseId, { orderIndex: 1, weight: 90 });
      
      await db.createSet(data1);
      await db.createSet(data2);

      await db.deleteSet(data1.id);

      const result = await db.getSetsByExercise(testExerciseId);
      expect(result).toHaveLength(1);
      expect(result[0].weight).toBe(90);
    });
  });

  describe('set progression tracking', () => {
    it('should track weight progression across sets', async () => {
      const set1 = createTestSet(testExerciseId, { orderIndex: 0, weight: 80, repetitions: 10 });
      const set2 = createTestSet(testExerciseId, { orderIndex: 1, weight: 85, repetitions: 8 });
      const set3 = createTestSet(testExerciseId, { orderIndex: 2, weight: 90, repetitions: 6 });
      
      await db.createSet(set1);
      await db.createSet(set2);
      await db.createSet(set3);

      const result = await db.getSetsByExercise(testExerciseId);

      expect(result).toHaveLength(3);
      expect(result[0].weight).toBe(80);
      expect(result[1].weight).toBe(85);
      expect(result[2].weight).toBe(90);
    });
  });
});

