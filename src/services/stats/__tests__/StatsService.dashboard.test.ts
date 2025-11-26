/**
 * Tests for StatsService - Dashboard Stats
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatsService } from '../StatsService';
import { StorageService } from '../../storage/StorageService';

describe('StatsService - Dashboard Stats', () => {
  let stats: StatsService;
  let storage: StorageService;
  const TEST_USER_ID = 'test-user-id';

  beforeEach(async () => {
    // Reset singletons
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

  describe('getDashboardStats', () => {
    it('should return empty stats when no data exists', async () => {
      const result = await stats.getDashboardStats(TEST_USER_ID);

      expect(result).toBeDefined();
      expect(result.totalPeriodizations).toBe(0);
      expect(result.activePeriodizations).toBe(0);
      expect(result.totalSessions).toBe(0);
      expect(result.completedSessions).toBe(0);
      expect(result.totalExercises).toBe(0);
      expect(result.totalSets).toBe(0);
      expect(result.completedSets).toBe(0);
      expect(result.totalVolume).toBe(0);
      expect(result.averageVolume).toBe(0);
      expect(result.currentStreak).toBe(0);
      expect(result.lastSession).toBeNull();
      expect(result.lastWorkoutDate).toBeNull();
    });

    it('should calculate total periodizations', async () => {
      await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Period 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
      await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Period 2',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      const result = await stats.getDashboardStats(TEST_USER_ID);

      expect(result.totalPeriodizations).toBe(2);
    });

    it('should calculate active periodizations (endDate in future)', async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead
      const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Active',
        startDate: now,
        endDate: futureDate,
      });
      await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Expired',
        startDate: pastDate,
        endDate: pastDate, // Ended in the past
      });

      const result = await stats.getDashboardStats(TEST_USER_ID);

      expect(result.activePeriodizations).toBe(1);
    });

    it('should calculate total and completed sessions', async () => {
      const periodization = await storage.createPeriodization({
        userId: TEST_USER_ID,
        name: 'Test Period',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: periodization.id,
        name: 'Session 1',
        scheduledAt: new Date('2024-06-15'),
        status: 'planned' as const,
      });
      await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: periodization.id,
        name: 'Session 2',
        scheduledAt: new Date('2024-06-16'),
        status: 'completed' as const,
        completedAt: new Date('2024-06-16T10:00:00Z'),
      });

      const result = await stats.getDashboardStats(TEST_USER_ID);

      expect(result.totalSessions).toBe(2);
      expect(result.completedSessions).toBe(1);
    });

    it('should calculate total exercises and sets', async () => {
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
        status: 'completed' as const,
        completedAt: new Date('2024-06-15T10:00:00Z'),
      });

      const exercise1 = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session.id,
        name: 'Bench Press',
        orderIndex: 0,
      });

      const exercise2 = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session.id,
        name: 'Squat',
        orderIndex: 1,
      });

      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: exercise1.id,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: exercise1.id,
        orderIndex: 1,
        repetitions: 8,
        weight: 110,
      });
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: exercise2.id,
        orderIndex: 0,
        repetitions: 12,
        weight: 80,
      });

      const result = await stats.getDashboardStats(TEST_USER_ID);

      expect(result.totalExercises).toBe(2);
      expect(result.totalSets).toBe(3);
    });

    it('should calculate total volume (weight * reps)', async () => {
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
        status: 'completed' as const,
      });

      const exercise = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session.id,
        name: 'Bench Press',
        orderIndex: 0,
      });

      // Set 1: 100kg * 10 reps = 1000
      // Set 2: 110kg * 8 reps = 880
      // Total: 1880
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: exercise.id,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: exercise.id,
        orderIndex: 1,
        repetitions: 8,
        weight: 110,
      });

      const result = await stats.getDashboardStats(TEST_USER_ID);

      expect(result.totalVolume).toBe(1880);
    });

    it('should calculate average volume per completed session', async () => {
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
        status: 'completed' as const,
        completedAt: new Date('2024-06-15T10:00:00Z'), // Must have completedAt
      });

      const exercise = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session.id,
        name: 'Bench Press',
        orderIndex: 0,
      });

      // Total volume: 1880, Completed Sessions: 1, Average: 1880
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: exercise.id,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
      });
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: exercise.id,
        orderIndex: 1,
        repetitions: 8,
        weight: 110,
      });

      const result = await stats.getDashboardStats(TEST_USER_ID);

      expect(result.averageVolume).toBe(1880); // Total volume / completed sessions
    });

    it('should identify last completed session', async () => {
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

      const recentSession = await storage.createSession({
        userId: TEST_USER_ID,
        periodizationId: periodization.id,
        name: 'Recent Session',
        scheduledAt: new Date('2024-06-15'),
        status: 'completed' as const,
        completedAt: new Date('2024-06-15T10:00:00Z'),
      });

      const result = await stats.getDashboardStats(TEST_USER_ID);

      expect(result.lastSession).toBeDefined();
      expect(result.lastSession!.name).toBe('Recent Session');
      expect(result.lastWorkoutDate).toBeInstanceOf(Date);
    });

    it('should count completed sets', async () => {
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
        status: 'completed' as const,
      });

      const exercise = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session.id,
        name: 'Bench Press',
        orderIndex: 0,
      });

      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: exercise.id,
        orderIndex: 0,
        repetitions: 10,
        weight: 100,
        completedAt: new Date('2024-06-15T10:00:00Z'),
      });
      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: exercise.id,
        orderIndex: 1,
        repetitions: 8,
        weight: 110,
      });

      const result = await stats.getDashboardStats(TEST_USER_ID);

      expect(result.totalSets).toBe(2);
      expect(result.completedSets).toBe(1);
    });

    it('should handle sets with zero weight or reps', async () => {
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
        status: 'completed' as const,
      });

      const exercise = await storage.createExercise({
        userId: TEST_USER_ID,
        sessionId: session.id,
        name: 'Bodyweight Exercise',
        orderIndex: 0,
      });

      await storage.createSet({
        userId: TEST_USER_ID,
        exerciseId: exercise.id,
        orderIndex: 0,
        repetitions: 10,
        weight: 0,
      });

      const result = await stats.getDashboardStats(TEST_USER_ID);

      expect(result.totalVolume).toBe(0);
      expect(result.totalSets).toBe(1);
    });
  });
});

