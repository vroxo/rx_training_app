/**
 * Tests for StorageService - Periodizations CRUD
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../StorageService';
import type { Periodization } from '../../../models';

describe('StorageService - Periodizations', () => {
  let storage: StorageService;
  const TEST_USER_ID = 'test-user-id';

  beforeEach(async () => {
    // Reset singleton instance
    (StorageService as any).instance = null;
    
    // Clear AsyncStorage mock
    await AsyncStorage.clear();
    
    storage = StorageService.getInstance();
    await storage.init();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
    (StorageService as any).instance = null;
  });

  describe('createPeriodization', () => {
    it('should create a periodization successfully', async () => {
      const data = {
        userId: TEST_USER_ID,
        name: 'Test Periodization',
        description: 'Test description',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        needsSync: true,
      };

      const result = await storage.createPeriodization(data);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(data.name);
      expect(result.description).toBe(data.description);
      expect(result.userId).toBe(TEST_USER_ID);
      expect(result.needsSync).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs', async () => {
      const data = {
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result1 = await storage.createPeriodization(data);
      const result2 = await storage.createPeriodization(data);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should use provided ID if given', async () => {
      const customId = 'custom-id-123';
      const data = {
        id: customId,
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = await storage.createPeriodization(data);

      expect(result.id).toBe(customId);
    });

    it('should set needsSync to true by default', async () => {
      const data = {
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = await storage.createPeriodization(data);

      expect(result.needsSync).toBe(true);
    });

    it('should accept needsSync as false when specified', async () => {
      const data = {
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        needsSync: false,
      };

      const result = await storage.createPeriodization(data);

      expect(result.needsSync).toBe(false);
    });
  });

  describe('getPeriodizationById', () => {
    it('should retrieve a periodization by id', async () => {
      const created = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      const result = await storage.getPeriodizationById(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(created.id);
      expect(result!.name).toBe(created.name);
    });

    it('should return null for non-existent id', async () => {
      const result = await storage.getPeriodizationById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should not return soft-deleted periodizations', async () => {
      const created = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      await storage.deletePeriodization(created.id);
      const result = await storage.getPeriodizationById(created.id);

      expect(result).toBeNull();
    });
  });

  describe('getPeriodizationByIdIncludingDeleted', () => {
    it('should return soft-deleted periodizations', async () => {
      const created = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      await storage.deletePeriodization(created.id);
      const result = await storage.getPeriodizationByIdIncludingDeleted(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(created.id);
      expect(result!.deletedAt).toBeDefined();
    });
  });

  describe('getAllPeriodizations', () => {
    it('should return empty array when no periodizations exist', async () => {
      const result = await storage.getAllPeriodizations(TEST_USER_ID);

      expect(result).toEqual([]);
    });

    it('should retrieve all periodizations for a user', async () => {
      await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'First',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
      await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Second',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      const result = await storage.getAllPeriodizations(TEST_USER_ID);

      expect(result).toHaveLength(2);
      expect(result.map(p => p.name)).toContain('First');
      expect(result.map(p => p.name)).toContain('Second');
    });

    it('should order by createdAt DESC', async () => {
      const first = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'First',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const second = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Second',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      const result = await storage.getAllPeriodizations(TEST_USER_ID);

      expect(result[0].name).toBe('Second'); // Most recent first
      expect(result[1].name).toBe('First');
    });

    it('should not return soft-deleted periodizations', async () => {
      const active = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
      
      const deleted = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Deleted',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
      
      await storage.deletePeriodization(deleted.id);

      const result = await storage.getAllPeriodizations(TEST_USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active');
    });

    it('should only return periodizations for specified user', async () => {
      await storage.createPeriodization({
        userId: 'user-1',
        name: 'User 1 Periodization',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
      
      await storage.createPeriodization({
        userId: 'user-2',
        name: 'User 2 Periodization',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      const user1Result = await storage.getAllPeriodizations('user-1');
      const user2Result = await storage.getAllPeriodizations('user-2');

      expect(user1Result).toHaveLength(1);
      expect(user2Result).toHaveLength(1);
      expect(user1Result[0].userId).toBe('user-1');
      expect(user2Result[0].userId).toBe('user-2');
    });
  });

  describe('getAllPeriodizationsIncludingDeleted', () => {
    it('should return soft-deleted periodizations', async () => {
      await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
      
      const deleted = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Deleted',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
      
      await storage.deletePeriodization(deleted.id);

      const result = await storage.getAllPeriodizationsIncludingDeleted(TEST_USER_ID);

      expect(result).toHaveLength(2);
    });
  });

  describe('updatePeriodization', () => {
    it('should update periodization name', async () => {
      const created = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Original',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      await storage.updatePeriodization(created.id, { name: 'Updated' });
      const result = await storage.getPeriodizationById(created.id);

      expect(result!.name).toBe('Updated');
    });

    it('should update multiple fields', async () => {
      const created = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Original',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      await storage.updatePeriodization(created.id, {
        name: 'Updated Name',
        description: 'Updated Description',
      });
      const result = await storage.getPeriodizationById(created.id);

      expect(result!.name).toBe('Updated Name');
      expect(result!.description).toBe('Updated Description');
    });

    it('should update updatedAt timestamp', async () => {
      const created = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));

      await storage.updatePeriodization(created.id, { name: 'Updated' });
      const result = await storage.getPeriodizationById(created.id);

      expect(result!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should set needsSync to true by default on update', async () => {
      const created = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        needsSync: false,
      });

      await storage.updatePeriodization(created.id, { name: 'Updated' });
      const result = await storage.getPeriodizationById(created.id);

      expect(result!.needsSync).toBe(true);
    });
  });

  describe('deletePeriodization', () => {
    it('should soft delete a periodization', async () => {
      const created = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      await storage.deletePeriodization(created.id);
      const result = await storage.getPeriodizationById(created.id);

      expect(result).toBeNull();
    });

    it('should set deletedAt timestamp', async () => {
      const created = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      await storage.deletePeriodization(created.id);
      const deletedRecord = await storage.getPeriodizationByIdIncludingDeleted(created.id);

      expect(deletedRecord!.deletedAt).toBeInstanceOf(Date);
    });

    it('should set needsSync to true on delete', async () => {
      const created = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        needsSync: false,
      });

      await storage.deletePeriodization(created.id);
      const deletedRecord = await storage.getPeriodizationByIdIncludingDeleted(created.id);

      expect(deletedRecord!.needsSync).toBe(true);
    });

    it('should not affect other periodizations', async () => {
      const first = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'First',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
      
      const second = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Second',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      await storage.deletePeriodization(first.id);

      const result = await storage.getAllPeriodizations(TEST_USER_ID);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Second');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in name', async () => {
      const data = {
        userId: TEST_USER_ID,
        name: 'Test & Special <> Characters "quotes"',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = await storage.createPeriodization(data);

      expect(result.name).toBe(data.name);
    });

    it('should handle undefined description', async () => {
      const data = {
        userId: TEST_USER_ID,
        name: 'Test',
        description: undefined,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = await storage.createPeriodization(data);

      expect(result.description).toBeUndefined();
    });

    it('should handle undefined endDate', async () => {
      const data = {
        userId: TEST_USER_ID,
        name: 'Test',
        startDate: new Date('2024-01-01'),
        endDate: undefined,
      };

      const result = await storage.createPeriodization(data);

      expect(result.endDate).toBeUndefined();
    });
  });
});

