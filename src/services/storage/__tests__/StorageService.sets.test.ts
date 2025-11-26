/**
 * Tests for StorageService - Sets CRUD
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../StorageService';

describe('StorageService - Sets', () => {
  let storage: StorageService;
  const TEST_USER_ID = 'test-user-id';
  let testExerciseId: string;

  beforeEach(async () => {
    (StorageService as any).instance = null;
    await AsyncStorage.clear();
    
    storage = StorageService.getInstance();
    await storage.init();
    
    const periodization = await storage.createPeriodization({
      userId: TEST_USER_ID,
      name: 'Test Periodization',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });
    
    const session = await storage.createSession({
      userId: TEST_USER_ID,
      periodizationId: periodization.id,
      name: 'Test Session',
      scheduledAt: new Date('2024-06-15'),
      status: 'planned' as const,
    });
    
    const exercise = await storage.createExercise({
      userId: TEST_USER_ID,
      sessionId: session.id,
      name: 'Test Exercise',
      orderIndex: 0,
    });
    testExerciseId = exercise.id;
  });

  afterEach(async () => {
    await AsyncStorage.clear();
    (StorageService as any).instance = null;
  });

  describe('createSet', () => {
    it('should create a set successfully', async () => {
      const data = {
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      };

      const result = await storage.createSet(data);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.exerciseId).toBe(testExerciseId);
      expect(result.repetitions).toBe(10);
      expect(result.weight).toBe(100);
      expect(result.needsSync).toBe(true);
    });

    it('should create set with all fields', async () => {
      const data = {
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 12,
        weight: 80,
        restTime: 120,
        rir: 2,
        rpe: 8,
        notes: 'Good form',
      };

      const result = await storage.createSet(data);

      expect(result.restTime).toBe(120);
      expect(result.rir).toBe(2);
      expect(result.rpe).toBe(8);
      expect(result.notes).toBe('Good form');
    });
  });

  describe('getSetById', () => {
    it('should retrieve a set by id', async () => {
      const created = await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });

      const result = await storage.getSetById(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(created.id);
      expect(result!.repetitions).toBe(10);
    });

    it('should return null for non-existent id', async () => {
      const result = await storage.getSetById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return soft-deleted sets', async () => {
      const created = await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });

      await storage.deleteSet(created.id);
      const result = await storage.getSetById(created.id);

      expect(result).toBeNull();
    });
  });

  describe('getSetsByExercise', () => {
    it('should return empty array when no sets exist', async () => {
      const result = await storage.getSetsByExercise(testExerciseId);

      expect(result).toEqual([]);
    });

    it('should retrieve all sets for an exercise', async () => {
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 1,
        repetitions: 8,
        weight: 110,
      });

      const result = await storage.getSetsByExercise(testExerciseId);

      expect(result).toHaveLength(2);
    });

    it('should order by orderIndex ASC', async () => {
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 2,
        repetitions: 6,
        weight: 120,
      });
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 1,
        repetitions: 8,
        weight: 110,
      });

      const result = await storage.getSetsByExercise(testExerciseId);

      expect(result[0].weight).toBe(100);
      expect(result[1].weight).toBe(110);
      expect(result[2].weight).toBe(120);
    });

    it('should not return soft-deleted sets', async () => {
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });

      const deleted = await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 1,
        repetitions: 8,
        weight: 110,
      });

      await storage.deleteSet(deleted.id);

      const result = await storage.getSetsByExercise(testExerciseId);

      expect(result).toHaveLength(1);
      expect(result[0].weight).toBe(100);
    });
  });

  describe('updateSet', () => {
    it('should update set weight', async () => {
      const created = await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });

      await storage.updateSet(created.id, { weight: 120 });
      const result = await storage.getSetById(created.id);

      expect(result!.weight).toBe(120);
    });

    it('should update set repetitions', async () => {
      const created = await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });

      await storage.updateSet(created.id, { repetitions: 12 });
      const result = await storage.getSetById(created.id);

      expect(result!.repetitions).toBe(12);
    });

    it('should update RIR and RPE', async () => {
      const created = await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });

      await storage.updateSet(created.id, { rir: 1, rpe: 9 });
      const result = await storage.getSetById(created.id);

      expect(result!.rir).toBe(1);
      expect(result!.rpe).toBe(9);
    });

    it('should set needsSync to true on update', async () => {
      const created = await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
        needsSync: false,
      });

      await storage.updateSet(created.id, { weight: 120 });
      const result = await storage.getSetById(created.id);

      expect(result!.needsSync).toBe(true);
    });
  });

  describe('deleteSet', () => {
    it('should soft delete a set', async () => {
      const created = await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });

      await storage.deleteSet(created.id);
      const result = await storage.getSetById(created.id);

      expect(result).toBeNull();
    });

    it('should set needsSync to true on delete', async () => {
      const created = await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: testExerciseId,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
        needsSync: false,
      });

      await storage.deleteSet(created.id);
      const deletedRecord = await storage.getSetByIdIncludingDeleted(created.id);

      expect(deletedRecord!.needsSync).toBe(true);
    });
  });
});

