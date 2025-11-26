/**
 * Tests for DatabaseService - Exercises CRUD
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
} from './testHelpers';

describe('DatabaseService - Exercises', () => {
  let db: DatabaseService;
  const TEST_USER_ID = 'test-user-id';
  let testSessionId: string;

  beforeEach(async () => {
    _resetMockTables();
    jest.clearAllMocks();
    
    db = await createTestDatabase();
    
    // Create test periodization and session for foreign keys
    const periodization = createTestPeriodization();
    await db.createPeriodization(periodization);
    
    const session = createTestSession(periodization.id);
    await db.createSession(session);
    testSessionId = session.id;
  });

  afterEach(async () => {
    try {
      await cleanupDatabase(db);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('createExercise', () => {
    it('should create an exercise successfully', async () => {
      const data = createTestExercise(testSessionId);

      const result = await db.createExercise(data);

      expect(result).toBeDefined();
      expect(result.id).toBe(data.id);
      expect(result.name).toBe(data.name);
      expect(result.sessionId).toBe(testSessionId);
      expect(result.orderIndex).toBe(0);
      expect(result.needsSync).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should create exercise with all fields', async () => {
      const data = createTestExercise(testSessionId, {
        name: 'Bench Press',
        muscleGroup: 'chest',
        equipment: 'barbell',
        notes: 'Focus on form',
        orderIndex: 1,
      });

      const result = await db.createExercise(data);

      expect(result.name).toBe('Bench Press');
      expect(result.muscleGroup).toBe('chest');
      expect(result.equipment).toBe('barbell');
      expect(result.notes).toBe('Focus on form');
      expect(result.orderIndex).toBe(1);
    });

    it('should create exercise with null optional fields', async () => {
      const data = createTestExercise(testSessionId, {
        muscleGroup: undefined,
        equipment: undefined,
        notes: undefined,
      });

      const result = await db.createExercise(data);

      expect(result.muscleGroup).toBeFalsy();
      expect(result.equipment).toBeFalsy();
      expect(result.notes).toBeFalsy();
    });
  });

  describe('getExerciseById', () => {
    it('should retrieve an exercise by id', async () => {
      const data = createTestExercise(testSessionId);
      await db.createExercise(data);

      const result = await db.getExerciseById(data.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(data.id);
      expect(result!.name).toBe(data.name);
    });

    it('should return null for non-existent id', async () => {
      const result = await db.getExerciseById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return soft-deleted exercises', async () => {
      const data = createTestExercise(testSessionId);
      await db.createExercise(data);
      await db.deleteExercise(data.id);

      const result = await db.getExerciseById(data.id);

      expect(result).toBeNull();
    });
  });

  describe('getExercisesBySession', () => {
    it('should return empty array when no exercises exist', async () => {
      const result = await db.getExercisesBySession(testSessionId);

      expect(result).toEqual([]);
    });

    it('should retrieve all exercises for a session', async () => {
      const data1 = createTestExercise(testSessionId, { name: 'Exercise A', orderIndex: 0 });
      const data2 = createTestExercise(testSessionId, { name: 'Exercise B', orderIndex: 1 });
      
      await db.createExercise(data1);
      await db.createExercise(data2);

      const result = await db.getExercisesBySession(testSessionId);

      expect(result).toHaveLength(2);
      expect(result.map(e => e.name)).toContain('Exercise A');
      expect(result.map(e => e.name)).toContain('Exercise B');
    });

    it('should order exercises by order_index ASC', async () => {
      const data1 = createTestExercise(testSessionId, { name: 'Third', orderIndex: 2 });
      const data2 = createTestExercise(testSessionId, { name: 'First', orderIndex: 0 });
      const data3 = createTestExercise(testSessionId, { name: 'Second', orderIndex: 1 });
      
      await db.createExercise(data1);
      await db.createExercise(data2);
      await db.createExercise(data3);

      const result = await db.getExercisesBySession(testSessionId);

      expect(result[0].name).toBe('First');
      expect(result[1].name).toBe('Second');
      expect(result[2].name).toBe('Third');
    });

    it('should not return exercises from other sessions', async () => {
      const periodization = createTestPeriodization();
      await db.createPeriodization(periodization);
      const otherSession = createTestSession(periodization.id, { name: 'Other' });
      await db.createSession(otherSession);

      const exercise1 = createTestExercise(testSessionId, { name: 'Exercise 1' });
      const exercise2 = createTestExercise(otherSession.id, { name: 'Exercise 2' });
      
      await db.createExercise(exercise1);
      await db.createExercise(exercise2);

      const result = await db.getExercisesBySession(testSessionId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Exercise 1');
    });

    it('should not return soft-deleted exercises', async () => {
      const data1 = createTestExercise(testSessionId, { name: 'Active' });
      const data2 = createTestExercise(testSessionId, { name: 'Deleted' });
      
      await db.createExercise(data1);
      await db.createExercise(data2);
      await db.deleteExercise(data2.id);

      const result = await db.getExercisesBySession(testSessionId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active');
    });
  });

  describe('updateExercise', () => {
    it('should update exercise name', async () => {
      const data = createTestExercise(testSessionId, { name: 'Original' });
      await db.createExercise(data);

      await db.updateExercise(data.id, { name: 'Updated' });
      const result = await db.getExerciseById(data.id);

      expect(result!.name).toBe('Updated');
    });

    it('should update muscle group', async () => {
      const data = createTestExercise(testSessionId);
      await db.createExercise(data);

      await db.updateExercise(data.id, { muscleGroup: 'legs' });
      const result = await db.getExerciseById(data.id);

      expect(result!.muscleGroup).toBe('legs');
    });

    it('should update equipment', async () => {
      const data = createTestExercise(testSessionId);
      await db.createExercise(data);

      await db.updateExercise(data.id, { equipment: 'dumbbells' });
      const result = await db.getExerciseById(data.id);

      expect(result!.equipment).toBe('dumbbells');
    });

    it('should update order index', async () => {
      const data = createTestExercise(testSessionId, { orderIndex: 0 });
      await db.createExercise(data);

      await db.updateExercise(data.id, { orderIndex: 5 });
      const result = await db.getExerciseById(data.id);

      expect(result!.orderIndex).toBe(5);
    });

    it('should update multiple fields at once', async () => {
      const data = createTestExercise(testSessionId);
      await db.createExercise(data);

      await db.updateExercise(data.id, {
        name: 'Updated Name',
        muscleGroup: 'back',
        notes: 'Updated Notes',
      });
      const result = await db.getExerciseById(data.id);

      expect(result!.name).toBe('Updated Name');
      expect(result!.muscleGroup).toBe('back');
      expect(result!.notes).toBe('Updated Notes');
    });

    it('should set needs_sync to true on update', async () => {
      const data = createTestExercise(testSessionId);
      await db.createExercise(data);

      await db.updateExercise(data.id, { name: 'Updated' });
      const result = await db.getExerciseById(data.id);

      expect(result!.needsSync).toBe(true);
    });
  });

  describe('deleteExercise', () => {
    it('should soft delete an exercise', async () => {
      const data = createTestExercise(testSessionId);
      await db.createExercise(data);

      await db.deleteExercise(data.id);
      const result = await db.getExerciseById(data.id);

      expect(result).toBeNull();
    });

    it('should not affect other exercises', async () => {
      const data1 = createTestExercise(testSessionId, { name: 'First' });
      const data2 = createTestExercise(testSessionId, { name: 'Second' });
      
      await db.createExercise(data1);
      await db.createExercise(data2);

      await db.deleteExercise(data1.id);

      const result = await db.getExercisesBySession(testSessionId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Second');
    });
  });

  describe('order index management', () => {
    it('should maintain correct order after reordering', async () => {
      const ex1 = createTestExercise(testSessionId, { name: 'Ex1', orderIndex: 0 });
      const ex2 = createTestExercise(testSessionId, { name: 'Ex2', orderIndex: 1 });
      const ex3 = createTestExercise(testSessionId, { name: 'Ex3', orderIndex: 2 });
      
      await db.createExercise(ex1);
      await db.createExercise(ex2);
      await db.createExercise(ex3);

      // Move Ex3 to first position
      await db.updateExercise(ex3.id, { orderIndex: 0 });
      await db.updateExercise(ex1.id, { orderIndex: 1 });
      await db.updateExercise(ex2.id, { orderIndex: 2 });

      const result = await db.getExercisesBySession(testSessionId);

      expect(result[0].name).toBe('Ex3');
      expect(result[1].name).toBe('Ex1');
      expect(result[2].name).toBe('Ex2');
    });
  });
});

