/**
 * Tests for Exercise Schema validation
 */

import { exerciseSchema } from '../exercise.schema';

describe('exerciseSchema', () => {
  describe('valid data', () => {
    it('should validate with all required fields', () => {
      const validData = {
        name: 'Supino Reto',
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with all fields', () => {
      const validData = {
        name: 'Agachamento Livre',
        notes: 'Manter postura correta',
        muscleGroup: 'legs',
        equipmentType: 'barbell',
        conjugatedGroup: 'A1',
        conjugatedOrder: 1,
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Agachamento Livre');
        expect(result.data.notes).toBe('Manter postura correta');
        expect(result.data.muscleGroup).toBe('legs');
        expect(result.data.equipmentType).toBe('barbell');
        expect(result.data.conjugatedGroup).toBe('A1');
        expect(result.data.conjugatedOrder).toBe(1);
      }
    });

    it('should validate with only optional fields as undefined', () => {
      const validData = {
        name: 'Remada Curvada',
        notes: undefined,
        muscleGroup: undefined,
        equipmentType: undefined,
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with minimum name length', () => {
      const validData = {
        name: 'Ab', // 2 characters (minimum)
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with maximum name length', () => {
      const validData = {
        name: 'A'.repeat(100), // 100 characters (maximum)
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('name validation', () => {
    it('should fail when name is missing', () => {
      const invalidData = {
        notes: 'Some notes',
      };

      const result = exerciseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should fail when name is empty string', () => {
      const invalidData = {
        name: '',
      };

      const result = exerciseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2 caracteres');
      }
    });

    it('should fail when name is too short (1 character)', () => {
      const invalidData = {
        name: 'A',
      };

      const result = exerciseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nome deve ter no mínimo 2 caracteres');
      }
    });

    it('should fail when name is too long (101 characters)', () => {
      const invalidData = {
        name: 'A'.repeat(101),
      };

      const result = exerciseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nome deve ter no máximo 100 caracteres');
      }
    });

    it('should fail when name is not a string', () => {
      const invalidData = {
        name: 123,
      };

      const result = exerciseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail when name is null', () => {
      const invalidData = {
        name: null,
      };

      const result = exerciseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('optional fields validation', () => {
    it('should accept notes as string', () => {
      const validData = {
        name: 'Leg Press',
        notes: 'Use full range of motion',
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept missing notes field', () => {
      const validData = {
        name: 'Leg Press',
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept muscleGroup as string', () => {
      const validData = {
        name: 'Bicep Curl',
        muscleGroup: 'arms',
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept equipmentType as string', () => {
      const validData = {
        name: 'Pull Up',
        equipmentType: 'bodyweight',
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept conjugatedGroup as string', () => {
      const validData = {
        name: 'Exercise 1',
        conjugatedGroup: 'A1',
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('conjugatedOrder validation', () => {
    it('should accept positive integer for conjugatedOrder', () => {
      const validData = {
        name: 'Exercise',
        conjugatedOrder: 1,
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept larger positive integers', () => {
      const validData = {
        name: 'Exercise',
        conjugatedOrder: 999,
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail for negative conjugatedOrder', () => {
      const invalidData = {
        name: 'Exercise',
        conjugatedOrder: -1,
      };

      const result = exerciseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail for zero conjugatedOrder', () => {
      const invalidData = {
        name: 'Exercise',
        conjugatedOrder: 0,
      };

      const result = exerciseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail for decimal conjugatedOrder', () => {
      const invalidData = {
        name: 'Exercise',
        conjugatedOrder: 1.5,
      };

      const result = exerciseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail for string conjugatedOrder', () => {
      const invalidData = {
        name: 'Exercise',
        conjugatedOrder: '1',
      };

      const result = exerciseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const result = exerciseSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should handle extra fields (should be ignored)', () => {
      const dataWithExtra = {
        name: 'Bench Press',
        extraField: 'should be ignored',
        anotherExtra: 123,
      };

      const result = exerciseSchema.safeParse(dataWithExtra);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in name', () => {
      const validData = {
        name: 'Supino 45° - (Máquina)',
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle unicode characters in name', () => {
      const validData = {
        name: 'Agachamento Búlgaro',
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle very long notes', () => {
      const validData = {
        name: 'Exercise',
        notes: 'A'.repeat(1000),
      };

      const result = exerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript types', () => {
      const validData = {
        name: 'Test Exercise',
        muscleGroup: 'chest',
        conjugatedOrder: 1,
      };

      const result = exerciseSchema.safeParse(validData);
      
      if (result.success) {
        // Type checks (compile-time)
        const name: string = result.data.name;
        const muscleGroup: string | undefined = result.data.muscleGroup;
        const conjugatedOrder: number | undefined = result.data.conjugatedOrder;
        
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
      }
    });
  });
});

