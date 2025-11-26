/**
 * Tests for DatabaseService - Periodizations CRUD
 * 
 * Note: This test file tests the DatabaseService using a mocked SQLite database.
 * The mock is defined in src/__mocks__/expo-sqlite.ts.
 */

// Force Jest to use the manual mock
jest.mock('expo-sqlite');

// Import mock functions to reset tables
import { _resetMockTables } from 'expo-sqlite';

import { DatabaseService } from '../DatabaseService';
import {
  createTestDatabase,
  cleanupDatabase,
  createTestPeriodization,
} from './testHelpers';

describe('DatabaseService - Periodizations', () => {
  let db: DatabaseService;
  const TEST_USER_ID = 'test-user-id';

  beforeEach(async () => {
    // Reset mock tables
    _resetMockTables();
    
    // Clear mock call history
    jest.clearAllMocks();
    
    // Create fresh database instance
    db = await createTestDatabase();
  });

  afterEach(async () => {
    try {
      await cleanupDatabase(db);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('createPeriodization', () => {
    it('should create a periodization successfully', async () => {
      const data = createTestPeriodization();

      const result = await db.createPeriodization(data);

      expect(result).toBeDefined();
      expect(result.id).toBe(data.id);
      expect(result.name).toBe(data.name);
    });

    it('should set needs_sync to true', async () => {
      const data = createTestPeriodization();

      const result = await db.createPeriodization(data);

      expect(result.needsSync).toBe(true);
    });
  });

  describe('getPeriodizationById', () => {
    it('should retrieve a periodization by id', async () => {
      const data = createTestPeriodization();
      await db.createPeriodization(data);

      const result = await db.getPeriodizationById(data.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(data.id);
    });

    it('should return null for non-existent id', async () => {
      const result = await db.getPeriodizationById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getAllPeriodizations', () => {
    it('should return empty array when no periodizations exist', async () => {
      const result = await db.getAllPeriodizations(TEST_USER_ID);

      expect(result).toEqual([]);
    });

    it('should retrieve all periodizations for a user', async () => {
      const data1 = createTestPeriodization({ name: 'First' });
      const data2 = createTestPeriodization({ name: 'Second' });
      
      await db.createPeriodization(data1);
      await db.createPeriodization(data2);

      const result = await db.getAllPeriodizations(TEST_USER_ID);

      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('updatePeriodization', () => {
    it('should update periodization name', async () => {
      const data = createTestPeriodization({ name: 'Original' });
      await db.createPeriodization(data);

      await db.updatePeriodization(data.id, { name: 'Updated' });
      const result = await db.getPeriodizationById(data.id);

      expect(result?.name).toBe('Updated');
    });
  });

  describe('deletePeriodization', () => {
    it('should soft delete a periodization', async () => {
      const data = createTestPeriodization();
      await db.createPeriodization(data);

      await db.deletePeriodization(data.id);
      const result = await db.getPeriodizationById(data.id);

      expect(result).toBeNull();
    });
  });
});
