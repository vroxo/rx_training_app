/**
 * Tests for DatabaseService - Sessions CRUD
 */

jest.mock('expo-sqlite');

import { _resetMockTables } from 'expo-sqlite';
import { DatabaseService } from '../DatabaseService';
import {
  createTestDatabase,
  cleanupDatabase,
  createTestPeriodization,
  createTestSession,
} from './testHelpers';

describe('DatabaseService - Sessions', () => {
  let db: DatabaseService;
  const TEST_USER_ID = 'test-user-id';
  let testPeriodizationId: string;

  beforeEach(async () => {
    _resetMockTables();
    jest.clearAllMocks();
    
    db = await createTestDatabase();
    
    // Create a test periodization for foreign key
    const periodization = createTestPeriodization();
    await db.createPeriodization(periodization);
    testPeriodizationId = periodization.id;
  });

  afterEach(async () => {
    try {
      await cleanupDatabase(db);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      const data = createTestSession(testPeriodizationId);

      const result = await db.createSession(data);

      expect(result).toBeDefined();
      expect(result.id).toBe(data.id);
      expect(result.name).toBe(data.name);
      expect(result.periodizationId).toBe(testPeriodizationId);
      expect(result.status).toBe('planned');
      expect(result.needsSync).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should set createdAt and updatedAt automatically', async () => {
      const data = createTestSession(testPeriodizationId);
      const beforeCreate = new Date();

      const result = await db.createSession(data);

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });

    it('should create session with all optional fields', async () => {
      const data = createTestSession(testPeriodizationId, {
        completedAt: new Date('2024-06-15T10:00:00.000Z'),
        notes: 'Completed successfully',
        status: 'completed',
      });

      const result = await db.createSession(data);

      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.notes).toBe('Completed successfully');
      expect(result.status).toBe('completed');
    });

    it('should create session with null optional fields', async () => {
      const data = createTestSession(testPeriodizationId, {
        completedAt: undefined,
        notes: undefined,
      });

      const result = await db.createSession(data);

      // SQLite returns null for NULL columns, not undefined
      expect(result.completedAt).toBeFalsy();
      expect(result.notes).toBeFalsy();
    });
  });

  describe('getSessionById', () => {
    it('should retrieve a session by id', async () => {
      const data = createTestSession(testPeriodizationId);
      await db.createSession(data);

      const result = await db.getSessionById(data.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(data.id);
      expect(result!.name).toBe(data.name);
      expect(result!.periodizationId).toBe(testPeriodizationId);
    });

    it('should return null for non-existent id', async () => {
      const result = await db.getSessionById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return soft-deleted sessions', async () => {
      const data = createTestSession(testPeriodizationId);
      await db.createSession(data);
      await db.deleteSession(data.id);

      const result = await db.getSessionById(data.id);

      expect(result).toBeNull();
    });
  });

  describe('getSessionsByPeriodization', () => {
    it('should return empty array when no sessions exist', async () => {
      const result = await db.getSessionsByPeriodization(testPeriodizationId);

      expect(result).toEqual([]);
    });

    it('should retrieve all sessions for a periodization', async () => {
      const data1 = createTestSession(testPeriodizationId, { name: 'Session A' });
      const data2 = createTestSession(testPeriodizationId, { name: 'Session B' });
      
      await db.createSession(data1);
      await db.createSession(data2);

      const result = await db.getSessionsByPeriodization(testPeriodizationId);

      expect(result).toHaveLength(2);
      expect(result.map(s => s.name)).toContain('Session A');
      expect(result.map(s => s.name)).toContain('Session B');
    });

    it('should not return sessions from other periodizations', async () => {
      const otherPeriodization = createTestPeriodization({ name: 'Other' });
      await db.createPeriodization(otherPeriodization);

      const session1 = createTestSession(testPeriodizationId, { name: 'Session 1' });
      const session2 = createTestSession(otherPeriodization.id, { name: 'Session 2' });
      
      await db.createSession(session1);
      await db.createSession(session2);

      const result = await db.getSessionsByPeriodization(testPeriodizationId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Session 1');
    });

    it('should not return soft-deleted sessions', async () => {
      const data1 = createTestSession(testPeriodizationId, { name: 'Active' });
      const data2 = createTestSession(testPeriodizationId, { name: 'Deleted' });
      
      await db.createSession(data1);
      await db.createSession(data2);
      await db.deleteSession(data2.id);

      const result = await db.getSessionsByPeriodization(testPeriodizationId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active');
    });
  });

  describe('updateSession', () => {
    it('should update session name', async () => {
      const data = createTestSession(testPeriodizationId, { name: 'Original' });
      await db.createSession(data);

      await db.updateSession(data.id, { name: 'Updated' });
      const result = await db.getSessionById(data.id);

      expect(result!.name).toBe('Updated');
    });

    it('should update session status', async () => {
      const data = createTestSession(testPeriodizationId, { status: 'planned' });
      await db.createSession(data);

      await db.updateSession(data.id, { status: 'in_progress' });
      const result = await db.getSessionById(data.id);

      expect(result!.status).toBe('in_progress');
    });

    it('should update completedAt', async () => {
      const data = createTestSession(testPeriodizationId);
      await db.createSession(data);
      const completedDate = new Date('2024-06-15T12:00:00.000Z');

      await db.updateSession(data.id, { completedAt: completedDate });
      const result = await db.getSessionById(data.id);

      expect(result!.completedAt).toBeInstanceOf(Date);
      expect(result!.completedAt?.toISOString()).toBe(completedDate.toISOString());
    });

    it('should update notes', async () => {
      const data = createTestSession(testPeriodizationId);
      await db.createSession(data);

      await db.updateSession(data.id, { notes: 'New notes' });
      const result = await db.getSessionById(data.id);

      expect(result!.notes).toBe('New notes');
    });

    it('should update multiple fields at once', async () => {
      const data = createTestSession(testPeriodizationId);
      await db.createSession(data);

      await db.updateSession(data.id, {
        name: 'Updated Name',
        status: 'completed',
        notes: 'Updated Notes',
      });
      const result = await db.getSessionById(data.id);

      expect(result!.name).toBe('Updated Name');
      expect(result!.status).toBe('completed');
      expect(result!.notes).toBe('Updated Notes');
    });

    it('should update updatedAt timestamp', async () => {
      const data = createTestSession(testPeriodizationId);
      const created = await db.createSession(data);
      await new Promise(resolve => setTimeout(resolve, 10));

      await db.updateSession(data.id, { name: 'Updated' });
      const result = await db.getSessionById(data.id);

      expect(result!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should set needs_sync to true on update', async () => {
      const data = createTestSession(testPeriodizationId);
      await db.createSession(data);

      await db.updateSession(data.id, { name: 'Updated' });
      const result = await db.getSessionById(data.id);

      expect(result!.needsSync).toBe(true);
    });
  });

  describe('deleteSession', () => {
    it('should soft delete a session', async () => {
      const data = createTestSession(testPeriodizationId);
      await db.createSession(data);

      await db.deleteSession(data.id);
      const result = await db.getSessionById(data.id);

      expect(result).toBeNull();
    });

    it('should not affect other sessions', async () => {
      const data1 = createTestSession(testPeriodizationId, { name: 'First' });
      const data2 = createTestSession(testPeriodizationId, { name: 'Second' });
      
      await db.createSession(data1);
      await db.createSession(data2);

      await db.deleteSession(data1.id);

      const result = await db.getSessionsByPeriodization(testPeriodizationId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Second');
    });
  });

  describe('session status transitions', () => {
    it('should transition from planned to in_progress', async () => {
      const data = createTestSession(testPeriodizationId, { status: 'planned' });
      await db.createSession(data);

      await db.updateSession(data.id, { status: 'in_progress' });
      const result = await db.getSessionById(data.id);

      expect(result!.status).toBe('in_progress');
    });

    it('should transition from in_progress to completed', async () => {
      const data = createTestSession(testPeriodizationId, { status: 'in_progress' });
      await db.createSession(data);

      await db.updateSession(data.id, { 
        status: 'completed',
        completedAt: new Date(),
      });
      const result = await db.getSessionById(data.id);

      expect(result!.status).toBe('completed');
      expect(result!.completedAt).toBeInstanceOf(Date);
    });
  });
});

