/**
 * Dados de teste reutilizáveis para os testes
 */

import type { Periodization, Session, Exercise, Set, User } from '../../models';

export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockPeriodization: Periodization = {
  id: 'period-1',
  userId: 'test-user-id',
  name: 'Hipertrofia 2024',
  description: 'Periodização de hipertrofia focada em ganho de massa',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-03-31'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  needsSync: false,
};

export const mockSession: Session = {
  id: 'session-1',
  userId: 'test-user-id',
  periodizationId: 'period-1',
  name: 'Treino A - Peito e Tríceps',
  scheduledAt: new Date('2024-01-15'),
  status: 'planned',
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10'),
  needsSync: false,
};

export const mockExercise: Exercise = {
  id: 'exercise-1',
  userId: 'test-user-id',
  sessionId: 'session-1',
  name: 'Supino Reto',
  muscleGroup: 'chest',
  equipment: 'barbell',
  orderIndex: 0,
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10'),
  needsSync: false,
};

export const mockSet: Set = {
  id: 'set-1',
  userId: 'test-user-id',
  exerciseId: 'exercise-1',
  orderIndex: 0,
  repetitions: 10,
  weight: 80,
  restTime: 90,
  rir: 2,
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10'),
  needsSync: false,
};

// Factory functions para criar dados de teste variados
export const createMockPeriodization = (overrides?: Partial<Periodization>): Periodization => ({
  ...mockPeriodization,
  id: `period-${Date.now()}`,
  ...overrides,
});

export const createMockSession = (overrides?: Partial<Session>): Session => ({
  ...mockSession,
  id: `session-${Date.now()}`,
  ...overrides,
});

export const createMockExercise = (overrides?: Partial<Exercise>): Exercise => ({
  ...mockExercise,
  id: `exercise-${Date.now()}`,
  ...overrides,
});

export const createMockSet = (overrides?: Partial<Set>): Set => ({
  ...mockSet,
  id: `set-${Date.now()}`,
  ...overrides,
});

