/**
 * Tests for StorageService - Sessions CRUD
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../StorageService';
import type { Session } from '../../../models';

describe('StorageService - Sessions', () => {
  let storage: StorageService;
  const TEST_USER_ID = 'test-user-id';
  let testPeriodizationId: string;

  beforeEach(async () => {
    (StorageService as any).instance = null;
    await AsyncStorage.clear();
    
    storage = StorageService.getInstance();
    await storage.init();
    
    // Create a periodization for foreign key
    const periodization = await storage.createPeriodization({
      userId: TEST_USER_ID,
      name: 'Test Periodization',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });
    testPeriodizationId = periodization.id;
  });

  afterEach(async () => {
    await AsyncStorage.clear();
    (StorageService as any).instance = null;
  });

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      const data = {
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Test Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      };

      const result = await storage.createSession(data);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Session');
      expect(result.periodizationId).toBe(testPeriodizationId);
      expect(result.status).toBe('planned');
      expect(result.needsSync).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs', async () => {
      const data = {
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      };

      const result1 = await storage.createSession(data);
      const result2 = await storage.createSession(data);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should use provided ID if given', async () => {
      const customId = 'custom-session-id';
      const data = {
        id: customId,
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      };

      const result = await storage.createSession(data);

      expect(result.id).toBe(customId);
    });

    it('should create session with optional fields', async () => {
      const data = {
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'completed' as const,
        completedAt: new Date('2024-06-15T10:00:00Z'),
        notes: 'Great workout',
      };

      const result = await storage.createSession(data);

      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.notes).toBe('Great workout');
    });
  });

  describe('getSessionById', () => {
    it('should retrieve a session by id', async () => {
      const created = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Test Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });

      const result = await storage.getSessionById(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe('Test Session');
    });

    it('should return null for non-existent id', async () => {
      const result = await storage.getSessionById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return soft-deleted sessions', async () => {
      const created = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });

      await storage.deleteSession(created.id);
      const result = await storage.getSessionById(created.id);

      expect(result).toBeNull();
    });
  });

  describe('getSessionByIdIncludingDeleted', () => {
    it('should return soft-deleted sessions', async () => {
      const created = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });

      await storage.deleteSession(created.id);
      const result = await storage.getSessionByIdIncludingDeleted(created.id);

      expect(result).toBeDefined();
      expect(result!.deletedAt).toBeDefined();
    });
  });

  describe('getSessionsByPeriodization', () => {
    it('should return empty array when no sessions exist', async () => {
      const result = await storage.getSessionsByPeriodization(testPeriodizationId);

      expect(result).toEqual([]);
    });

    it('should retrieve all sessions for a periodization', async () => {
      await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session 1',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });
      await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session 2',
        scheduledAt: new Date('2024-06-16'),
        status: 'planned' as const,
      });

      const result = await storage.getSessionsByPeriodization(testPeriodizationId);

      expect(result).toHaveLength(2);
      expect(result.map(s => s.name)).toContain('Session 1');
      expect(result.map(s => s.name)).toContain('Session 2');
    });

    it('should order by createdAt DESC', async () => {
      const first = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'First',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Second',
        scheduledAt: new Date('2024-06-16'),
        status: 'planned' as const,
      });

      const result = await storage.getSessionsByPeriodization(testPeriodizationId);

      expect(result[0].name).toBe('Second'); // Most recent first
      expect(result[1].name).toBe('First');
    });

    it('should not return soft-deleted sessions', async () => {
      await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Active',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });

      const deleted = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Deleted',
        scheduledAt: new Date('2024-06-16'),
        status: 'planned' as const,
      });

      await storage.deleteSession(deleted.id);

      const result = await storage.getSessionsByPeriodization(testPeriodizationId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active');
    });
  });

  describe('updateSession', () => {
    it('should update session name', async () => {
      const created = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Original',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });

      await storage.updateSession(created.id, { name: 'Updated' });
      const result = await storage.getSessionById(created.id);

      expect(result!.name).toBe('Updated');
    });

    it('should update session status', async () => {
      const created = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });

      await storage.updateSession(created.id, { status: 'completed' as const });
      const result = await storage.getSessionById(created.id);

      expect(result!.status).toBe('completed');
    });

    it('should update multiple fields', async () => {
      const created = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });

      await storage.updateSession(created.id, {
        name: 'Updated Name',
        status: 'completed' as const,
        notes: 'Updated notes',
      });
      const result = await storage.getSessionById(created.id);

      expect(result!.name).toBe('Updated Name');
      expect(result!.status).toBe('completed');
      expect(result!.notes).toBe('Updated notes');
    });

    it('should update updatedAt timestamp', async () => {
      const created = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await storage.updateSession(created.id, { name: 'Updated' });
      const result = await storage.getSessionById(created.id);

      expect(result!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should set needsSync to true on update', async () => {
      const created = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
        needsSync: false,
      });

      await storage.updateSession(created.id, { name: 'Updated' });
      const result = await storage.getSessionById(created.id);

      expect(result!.needsSync).toBe(true);
    });
  });

  describe('deleteSession', () => {
    it('should soft delete a session', async () => {
      const created = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });

      await storage.deleteSession(created.id);
      const result = await storage.getSessionById(created.id);

      expect(result).toBeNull();
    });

    it('should set deletedAt timestamp', async () => {
      const created = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });

      await storage.deleteSession(created.id);
      const deletedRecord = await storage.getSessionByIdIncludingDeleted(created.id);

      expect(deletedRecord!.deletedAt).toBeInstanceOf(Date);
    });

    it('should set needsSync to true on delete', async () => {
      const created = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: testPeriodizationId,
        name: 'Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
        needsSync: false,
      });

      await storage.deleteSession(created.id);
      const deletedRecord = await storage.getSessionByIdIncludingDeleted(created.id);

      expect(deletedRecord!.needsSync).toBe(true);
    });
  });
});

