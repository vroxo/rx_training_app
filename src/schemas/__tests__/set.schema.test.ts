/**
 * Tests for Set Schema validation
 */

import { setSchema } from '../set.schema';

describe('setSchema', () => {
  describe('valid data - standard set', () => {
    it('should validate with weight and reps', () => {
      const validData = {
        weight: 80,
        reps: 10,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with all basic fields', () => {
      const validData = {
        weight: 100,
        reps: 8,
        duration: 45,
        restTime: 90,
        notes: 'Good form',
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with only weight', () => {
      const validData = {
        weight: 50,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with only reps', () => {
      const validData = {
        reps: 15,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with zero values', () => {
      const validData = {
        weight: 0,
        reps: 0,
        duration: 0,
        restTime: 0,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate empty object (all fields optional)', () => {
      const validData = {};

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('weight validation', () => {
    it('should accept positive weight', () => {
      const validData = { weight: 100 };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should accept decimal weight', () => {
      const validData = { weight: 52.5 };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should accept zero weight', () => {
      const validData = { weight: 0 };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should fail for negative weight', () => {
      const invalidData = { weight: -10 };
      const result = setSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Peso não pode ser negativo');
      }
    });
  });

  describe('reps validation', () => {
    it('should accept positive reps', () => {
      const validData = { reps: 12 };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should accept zero reps', () => {
      const validData = { reps: 0 };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should fail for negative reps', () => {
      const invalidData = { reps: -5 };
      const result = setSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Repetições não podem ser negativas');
      }
    });
  });

  describe('duration validation', () => {
    it('should accept positive duration', () => {
      const validData = { duration: 60 };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should accept zero duration', () => {
      const validData = { duration: 0 };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should fail for negative duration', () => {
      const invalidData = { duration: -30 };
      const result = setSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Duração não pode ser negativa');
      }
    });
  });

  describe('restTime validation', () => {
    it('should accept positive rest time', () => {
      const validData = { restTime: 120 };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should accept zero rest time', () => {
      const validData = { restTime: 0 };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should fail for negative rest time', () => {
      const invalidData = { restTime: -60 };
      const result = setSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tempo de descanso não pode ser negativo');
      }
    });
  });

  describe('technique validation', () => {
    it('should accept standard technique', () => {
      const validData = { technique: 'standard' as const };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should accept dropset technique', () => {
      const validData = { technique: 'dropset' as const };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should accept restpause technique', () => {
      const validData = { technique: 'restpause' as const };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should accept clusterset technique', () => {
      const validData = { technique: 'clusterset' as const };
      expect(setSchema.safeParse(validData).success).toBe(true);
    });

    it('should fail for invalid technique', () => {
      const invalidData = { technique: 'invalid' };
      expect(setSchema.safeParse(invalidData).success).toBe(false);
    });

    it('should fail for empty string technique', () => {
      const invalidData = { technique: '' };
      expect(setSchema.safeParse(invalidData).success).toBe(false);
    });
  });

  describe('Drop Set validation', () => {
    it('should accept valid dropset configuration', () => {
      const validData = {
        technique: 'dropset' as const,
        dropSetWeights: [100, 80, 60],
        dropSetReps: [8, 10, 12],
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty dropset arrays', () => {
      const validData = {
        technique: 'dropset' as const,
        dropSetWeights: [],
        dropSetReps: [],
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept single drop', () => {
      const validData = {
        dropSetWeights: [80],
        dropSetReps: [10],
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail for negative dropset weight', () => {
      const invalidData = {
        dropSetWeights: [100, -50, 40],
      };

      const result = setSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Peso não pode ser negativo');
      }
    });

    it('should fail for zero reps in dropset', () => {
      const invalidData = {
        dropSetReps: [10, 0, 8],
      };

      const result = setSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Mínimo 1 repetição');
      }
    });

    it('should fail for negative reps in dropset', () => {
      const invalidData = {
        dropSetReps: [10, -5, 8],
      };

      const result = setSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Rest Pause validation', () => {
    it('should accept valid rest pause duration', () => {
      const validData = {
        technique: 'restpause' as const,
        restPauseDuration: 15,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept minimum rest pause duration (5 seconds)', () => {
      const validData = {
        restPauseDuration: 5,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept maximum rest pause duration (60 seconds)', () => {
      const validData = {
        restPauseDuration: 60,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail for rest pause duration below minimum', () => {
      const invalidData = {
        restPauseDuration: 4,
      };

      const result = setSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Duração mínima: 5 segundos');
      }
    });

    it('should fail for rest pause duration above maximum', () => {
      const invalidData = {
        restPauseDuration: 61,
      };

      const result = setSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Duração máxima: 60 segundos');
      }
    });
  });

  describe('Cluster Set validation', () => {
    it('should accept valid cluster set configuration', () => {
      const validData = {
        technique: 'clusterset' as const,
        clusterReps: 3,
        clusterRestDuration: 10,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept minimum cluster reps (1)', () => {
      const validData = {
        clusterReps: 1,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept large cluster reps', () => {
      const validData = {
        clusterReps: 100,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail for zero cluster reps', () => {
      const invalidData = {
        clusterReps: 0,
      };

      const result = setSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Mínimo 1 rep por cluster');
      }
    });

    it('should fail for negative cluster reps', () => {
      const invalidData = {
        clusterReps: -5,
      };

      const result = setSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept minimum cluster rest duration (5 seconds)', () => {
      const validData = {
        clusterRestDuration: 5,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept maximum cluster rest duration (60 seconds)', () => {
      const validData = {
        clusterRestDuration: 60,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail for cluster rest duration below minimum', () => {
      const invalidData = {
        clusterRestDuration: 4,
      };

      const result = setSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Duração mínima: 5 segundos');
      }
    });

    it('should fail for cluster rest duration above maximum', () => {
      const invalidData = {
        clusterRestDuration: 61,
      };

      const result = setSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Duração máxima: 60 segundos');
      }
    });
  });

  describe('notes validation', () => {
    it('should accept string notes', () => {
      const validData = {
        notes: 'Good set, felt strong',
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty string notes', () => {
      const validData = {
        notes: '',
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept very long notes', () => {
      const validData = {
        notes: 'A'.repeat(1000),
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle extra fields (should be ignored)', () => {
      const dataWithExtra = {
        weight: 80,
        reps: 10,
        extraField: 'ignored',
      };

      const result = setSchema.safeParse(dataWithExtra);
      expect(result.success).toBe(true);
    });

    it('should handle decimal values', () => {
      const validData = {
        weight: 52.5,
        duration: 45.5,
        restTime: 90.3,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle large numbers', () => {
      const validData = {
        weight: 999999,
        reps: 999999,
        duration: 999999,
        restTime: 999999,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('combined techniques', () => {
    it('should accept all technique fields together', () => {
      const validData = {
        technique: 'dropset' as const,
        dropSetWeights: [100, 80],
        dropSetReps: [10, 12],
        restPauseDuration: 15,
        clusterReps: 5,
        clusterRestDuration: 10,
      };

      const result = setSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript types', () => {
      const validData = {
        weight: 80,
        reps: 10,
        technique: 'dropset' as const,
        notes: 'Test',
      };

      const result = setSchema.safeParse(validData);
      
      if (result.success) {
        // Type checks (compile-time)
        const weight: number | undefined = result.data.weight;
        const reps: number | undefined = result.data.reps;
        const technique: 'standard' | 'dropset' | 'restpause' | 'clusterset' | undefined = result.data.technique;
        
        expect(weight).toBeDefined();
        expect(reps).toBeDefined();
        expect(technique).toBeDefined();
      }
    });
  });
});

