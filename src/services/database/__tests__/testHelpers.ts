/**
 * Test helpers for DatabaseService tests
 */

import { DatabaseService } from '../DatabaseService';
import type { Periodization, Session, Exercise, Set } from '../../../models';

/**
 * Creates a test database instance
 * Uses a real SQLite database in memory for testing
 */
export async function createTestDatabase(): Promise<DatabaseService> {
  // Reset Singleton instance for testing
  (DatabaseService as any).instance = null;
  
  const db = DatabaseService.getInstance();
  await db.init();
  return db;
}

/**
 * Cleans up and closes the database
 */
export async function cleanupDatabase(db: DatabaseService): Promise<void> {
  try {
    await db.close();
  } catch (error) {
    // Ignore errors during cleanup
  }
  // Reset Singleton instance after cleanup
  (DatabaseService as any).instance = null;
}

/**
 * Factory functions for creating test data
 */

let testIdCounter = 0;

export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${testIdCounter++}`;
}

export function createTestPeriodization(overrides?: Partial<Omit<Periodization, 'createdAt' | 'updatedAt'>>): Omit<Periodization, 'createdAt' | 'updatedAt'> {
  return {
    id: generateTestId('period'),
    userId: 'test-user-id',
    name: 'Test Periodization',
    description: 'Test description',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    needsSync: true,
    ...overrides,
  };
}

export function createTestSession(
  periodizationId: string,
  overrides?: Partial<Omit<Session, 'createdAt' | 'updatedAt'>>
): Omit<Session, 'createdAt' | 'updatedAt'> {
  return {
    id: generateTestId('session'),
    userId: 'test-user-id',
    periodizationId,
    name: 'Test Session',
    scheduledAt: new Date('2024-06-15'),
    status: 'planned',
    notes: 'Test notes',
    needsSync: true,
    ...overrides,
  };
}

export function createTestExercise(
  sessionId: string,
  overrides?: Partial<Omit<Exercise, 'createdAt' | 'updatedAt'>>
): Omit<Exercise, 'createdAt' | 'updatedAt'> {
  return {
    id: generateTestId('exercise'),
    userId: 'test-user-id',
    sessionId,
    name: 'Test Exercise',
    muscleGroup: 'chest',
    equipment: 'barbell',
    notes: 'Test notes',
    orderIndex: 0,
    needsSync: true,
    ...overrides,
  };
}

export function createTestSet(
  exerciseId: string,
  overrides?: Partial<Omit<Set, 'createdAt' | 'updatedAt'>>
): Omit<Set, 'createdAt' | 'updatedAt'> {
  return {
    id: generateTestId('set'),
    userId: 'test-user-id',
    exerciseId,
    orderIndex: 0,
    repetitions: 10,
    weight: 80,
    restTime: 90,
    rir: 2,
    rpe: 8,
    needsSync: true,
    ...overrides,
  };
}

/**
 * Assertions helpers
 */

export function assertPeriodizationEquals(
  actual: Periodization,
  expected: Partial<Periodization>
): void {
  if (expected.id) expect(actual.id).toBe(expected.id);
  if (expected.userId) expect(actual.userId).toBe(expected.userId);
  if (expected.name) expect(actual.name).toBe(expected.name);
  if (expected.description !== undefined) expect(actual.description).toBe(expected.description);
  if (expected.startDate) {
    expect(actual.startDate.toISOString()).toBe(expected.startDate.toISOString());
  }
  if (expected.endDate) {
    expect(actual.endDate?.toISOString()).toBe(expected.endDate.toISOString());
  }
}

export function assertSessionEquals(
  actual: Session,
  expected: Partial<Session>
): void {
  if (expected.id) expect(actual.id).toBe(expected.id);
  if (expected.userId) expect(actual.userId).toBe(expected.userId);
  if (expected.periodizationId) expect(actual.periodizationId).toBe(expected.periodizationId);
  if (expected.name) expect(actual.name).toBe(expected.name);
  if (expected.status) expect(actual.status).toBe(expected.status);
  if (expected.notes !== undefined) expect(actual.notes).toBe(expected.notes);
}

export function assertExerciseEquals(
  actual: Exercise,
  expected: Partial<Exercise>
): void {
  if (expected.id) expect(actual.id).toBe(expected.id);
  if (expected.userId) expect(actual.userId).toBe(expected.userId);
  if (expected.sessionId) expect(actual.sessionId).toBe(expected.sessionId);
  if (expected.name) expect(actual.name).toBe(expected.name);
  if (expected.muscleGroup) expect(actual.muscleGroup).toBe(expected.muscleGroup);
  if (expected.equipment) expect(actual.equipment).toBe(expected.equipment);
  if (expected.orderIndex !== undefined) expect(actual.orderIndex).toBe(expected.orderIndex);
}

export function assertSetEquals(
  actual: Set,
  expected: Partial<Set>
): void {
  if (expected.id) expect(actual.id).toBe(expected.id);
  if (expected.userId) expect(actual.userId).toBe(expected.userId);
  if (expected.exerciseId) expect(actual.exerciseId).toBe(expected.exerciseId);
  if (expected.orderIndex !== undefined) expect(actual.orderIndex).toBe(expected.orderIndex);
  if (expected.repetitions !== undefined) expect(actual.repetitions).toBe(expected.repetitions);
  if (expected.weight !== undefined) expect(actual.weight).toBe(expected.weight);
  if (expected.rir !== undefined) expect(actual.rir).toBe(expected.rir);
  if (expected.rpe !== undefined) expect(actual.rpe).toBe(expected.rpe);
}

