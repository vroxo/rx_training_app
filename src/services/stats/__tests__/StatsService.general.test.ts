/**
 * Tests for StatsService - General Methods
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatsService } from '../StatsService';
import { StorageService } from '../../storage/StorageService';

describe('StatsService - General Methods', () => {
  let stats: StatsService;
  let storage: StorageService;
  const TEST_USER_ID = 'test-user-id';

  beforeEach(async () => {
    (StatsService as any).instance = null;
    (StorageService as any).instance = null;
    await AsyncStorage.clear();
    
    stats = StatsService.getInstance();
    storage = StorageService.getInstance();
    await storage.init();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
    (StatsService as any).instance = null;
    (StorageService as any).instance = null;
  });

  describe('getRecentSessions', () => {
    it('should return empty array when no sessions exist', async () => {
      const result = await stats.getRecentSessions(TEST_USER_ID);

      expect(result).toEqual([]);
    });

    it('should return recent sessions ordered by date', async () => {
      const periodization = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test Period',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: periodization.id,
        name: 'Old Session',
        scheduledAt: new Date('2024-06-01'),
        status: 'completed' as const,
        completedAt: new Date('2024-06-01T10:00:00Z'),
      });

      await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: periodization.id,
        name: 'Recent Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'completed' as const,
        completedAt: new Date('2024-06-15T10:00:00Z'),
      });

      const result = await stats.getRecentSessions(TEST_USER_ID, 5);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Recent Session'); // Most recent first
      expect(result[1].name).toBe('Old Session');
    });

    it('should limit results to specified number', async () => {
      const periodization = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test Period',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      for (let i = 0; i < 10; i++) {
        await storage.createSession({
          userId: TEST_USER_ID,
          periodizationId: periodization.id,
          name: `Session ${i}`,
          scheduledAt: new Date(`2024-06-${i + 1}`),
          status: 'planned' as const,
        });
      }

      const result = await stats.getRecentSessions(TEST_USER_ID, 3);

      expect(result).toHaveLength(3);
    });
  });

  describe('getAllExerciseNames', () => {
    it('should return empty array when no exercises exist', async () => {
      const result = await stats.getAllExerciseNames(TEST_USER_ID);

      expect(result).toEqual([]);
    });

    it('should return unique exercise names sorted', async () => {
      const periodization = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test Period',
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

      await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session.id,
        name: 'Squat',
        orderIndex: 0,
      });

      await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session.id,
        name: 'Bench Press',
        orderIndex: 1,
      });

      await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session.id,
        name: 'Deadlift',
        orderIndex: 2,
      });

      const result = await stats.getAllExerciseNames(TEST_USER_ID);

      expect(result).toHaveLength(3);
      expect(result).toEqual(['Bench Press', 'Deadlift', 'Squat']); // Sorted alphabetically
    });

    it('should return unique names (no duplicates)', async () => {
      const periodization = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test Period',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      const session1 = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: periodization.id,
        name: 'Session 1',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });

      const session2 = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: periodization.id,
        name: 'Session 2',
        scheduledAt: new Date('2024-06-16'),
        status: 'planned' as const,
      });

      await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session1.id,
        name: 'Bench Press',
        orderIndex: 0,
      });

      await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session2.id,
        name: 'Bench Press',
        orderIndex: 0,
      });

      const result = await stats.getAllExerciseNames(TEST_USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('Bench Press');
    });
  });

  describe('getCurrentPeriodization', () => {
    it('should return null when no periodizations exist', async () => {
      const result = await stats.getCurrentPeriodization(TEST_USER_ID);

      expect(result).toBeNull();
    });

    it('should return active periodization with progress info', async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const endDate = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days ahead

      await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Active Period',
        description: 'Test description',
        startDate: startDate,
        endDate: endDate,
      });

      const result = await stats.getCurrentPeriodization(TEST_USER_ID);

      expect(result).toBeDefined();
      expect(result!.name).toBe('Active Period');
      expect(result!.description).toBe('Test description');
      expect(result!.currentWeek).toBeGreaterThan(0);
      expect(result!.totalWeeks).toBeGreaterThan(0);
      expect(result!.progressPercentage).toBeGreaterThan(0);
      expect(result!.progressPercentage).toBeLessThanOrEqual(100);
      expect(result!.daysRemaining).toBeGreaterThan(0);
    });

    it('should not return expired periodizations', async () => {
      const now = new Date();
      const pastStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
      const pastEndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Expired Period',
        startDate: pastStartDate,
        endDate: pastEndDate,
      });

      const result = await stats.getCurrentPeriodization(TEST_USER_ID);

      expect(result).toBeNull();
    });

    it('should not return soft-deleted periodizations', async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const periodization = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Deleted Period',
        startDate: now,
        endDate: futureDate,
      });

      await storage.deletePeriodization(periodization.id);

      const result = await stats.getCurrentPeriodization(TEST_USER_ID);

      expect(result).toBeNull();
    });
  });

  describe('getExerciseProgress', () => {
    it('should return empty progress when exercise not found', async () => {
      const result = await stats.getExerciseProgress(TEST_USER_ID, 'Nonexistent Exercise');

      expect(result).toBeDefined();
      expect(result.exerciseName).toBe('Nonexistent Exercise');
      expect(result.dates).toEqual([]);
      expect(result.maxWeights).toEqual([]);
      expect(result.totalVolumes).toEqual([]);
    });

    it('should calculate exercise progress over time', async () => {
      const periodization = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test Period',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      const session1 = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: periodization.id,
        name: 'Session 1',
        scheduledAt: new Date('2024-06-01'),
        status: 'completed' as const,
        completedAt: new Date('2024-06-01T10:00:00Z'),
      });

      const session2 = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: periodization.id,
        name: 'Session 2',
        scheduledAt: new Date('2024-06-08'),
        status: 'completed' as const,
        completedAt: new Date('2024-06-08T10:00:00Z'),
      });

      const exercise1 = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session1.id,
        name: 'Bench Press',
        orderIndex: 0,
      });

      const exercise2 = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session2.id,
        name: 'Bench Press',
        orderIndex: 0,
      });

      // Session 1: 100kg max, 1000 volume
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: exercise1.id,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });

      // Session 2: 110kg max, 880 volume
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: exercise2.id,
        orderIndex: 0,
        repetitions: 8,
        weight: 110,
      });

      const result = await stats.getExerciseProgress(TEST_USER_ID, 'Bench Press');

      expect(result.exerciseName).toBe('Bench Press');
      expect(result.dates).toHaveLength(2);
      expect(result.maxWeights).toEqual([100, 110]);
      expect(result.totalVolumes).toEqual([1000, 880]);
    });
  });
});

