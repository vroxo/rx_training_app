/**
 * Tests for StorageService - Exercises CRUD
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../StorageService';

describe('StorageService - Exercises', () => {
  let storage: StorageService;
  const TEST_USER_ID = 'test-user-id';
  let testSessionId: string;

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
    testSessionId = session.id;
  });

  afterEach(async () => {
    await AsyncStorage.clear();
    (StorageService as any).instance = null;
  });

  describe('createExercise', () => {
    it('should create an exercise successfully', async () => {
      const data = {
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Bench Press',
        orderIndex: 0,
      };

      const result = await storage.createExercise(data);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Bench Press');
      expect(result.sessionId).toBe(testSessionId);
      expect(result.orderIndex).toBe(0);
      expect(result.needsSync).toBe(true);
    });

    it('should create exercise with all fields', async () => {
      const data = {
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Squat',
        muscleGroup: 'legs',
        equipment: 'barbell',
        notes: 'Focus on depth',
        orderIndex: 1,
      };

      const result = await storage.createExercise(data);

      expect(result.muscleGroup).toBe('legs');
      expect(result.equipment).toBe('barbell');
      expect(result.notes).toBe('Focus on depth');
    });
  });

  describe('getExerciseById', () => {
    it('should retrieve an exercise by id', async () => {
      const created = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Deadlift',
        orderIndex: 0,
      });

      const result = await storage.getExerciseById(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe('Deadlift');
    });

    it('should return null for non-existent id', async () => {
      const result = await storage.getExerciseById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return soft-deleted exercises', async () => {
      const created = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Exercise',
        orderIndex: 0,
      });

      await storage.deleteExercise(created.id);
      const result = await storage.getExerciseById(created.id);

      expect(result).toBeNull();
    });
  });

  describe('getExercisesBySession', () => {
    it('should return empty array when no exercises exist', async () => {
      const result = await storage.getExercisesBySession(testSessionId);

      expect(result).toEqual([]);
    });

    it('should retrieve all exercises for a session', async () => {
      await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Exercise 1',
        orderIndex: 0,
      });
      await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Exercise 2',
        orderIndex: 1,
      });

      const result = await storage.getExercisesBySession(testSessionId);

      expect(result).toHaveLength(2);
    });

    it('should order by orderIndex ASC', async () => {
      await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Third',
        orderIndex: 2,
      });
      await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'First',
        orderIndex: 0,
      });
      await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Second',
        orderIndex: 1,
      });

      const result = await storage.getExercisesBySession(testSessionId);

      expect(result[0].name).toBe('First');
      expect(result[1].name).toBe('Second');
      expect(result[2].name).toBe('Third');
    });

    it('should not return soft-deleted exercises', async () => {
      await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Active',
        orderIndex: 0,
      });

      const deleted = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Deleted',
        orderIndex: 1,
      });

      await storage.deleteExercise(deleted.id);

      const result = await storage.getExercisesBySession(testSessionId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active');
    });
  });

  describe('updateExercise', () => {
    it('should update exercise name', async () => {
      const created = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Original',
        orderIndex: 0,
      });

      await storage.updateExercise(created.id, { name: 'Updated' });
      const result = await storage.getExerciseById(created.id);

      expect(result!.name).toBe('Updated');
    });

    it('should update orderIndex', async () => {
      const created = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Exercise',
        orderIndex: 0,
      });

      await storage.updateExercise(created.id, { orderIndex: 5 });
      const result = await storage.getExerciseById(created.id);

      expect(result!.orderIndex).toBe(5);
    });

    it('should set needsSync to true on update', async () => {
      const created = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Exercise',
        orderIndex: 0,
        needsSync: false,
      });

      await storage.updateExercise(created.id, { name: 'Updated' });
      const result = await storage.getExerciseById(created.id);

      expect(result!.needsSync).toBe(true);
    });
  });

  describe('deleteExercise', () => {
    it('should soft delete an exercise', async () => {
      const created = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Exercise',
        orderIndex: 0,
      });

      await storage.deleteExercise(created.id);
      const result = await storage.getExerciseById(created.id);

      expect(result).toBeNull();
    });

    it('should set needsSync to true on delete', async () => {
      const created = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: testSessionId,
        name: 'Exercise',
        orderIndex: 0,
        needsSync: false,
      });

      await storage.deleteExercise(created.id);
      const deletedRecord = await storage.getExerciseByIdIncludingDeleted(created.id);

      expect(deletedRecord!.needsSync).toBe(true);
    });
  });
});

