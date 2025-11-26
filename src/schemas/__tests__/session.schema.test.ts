/**
 * Tests for Session Schema validation
 */

import { sessionSchema } from '../session.schema';

describe('sessionSchema', () => {
  describe('valid data', () => {
    it('should validate with all required fields', () => {
      const validData = {
        name: 'Treino A',
        scheduledAt: new Date('2024-01-15T10:00:00.000Z'),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with all fields including notes', () => {
      const validData = {
        name: 'Treino de Peito',
        notes: 'Focar em hipertrofia',
        scheduledAt: new Date('2024-06-20T14:30:00.000Z'),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Treino de Peito');
        expect(result.data.notes).toBe('Focar em hipertrofia');
        expect(result.data.scheduledAt).toBeInstanceOf(Date);
      }
    });

    it('should validate with minimum name length', () => {
      const validData = {
        name: 'ABC', // 3 characters (minimum)
        scheduledAt: new Date(),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with maximum name length', () => {
      const validData = {
        name: 'A'.repeat(100), // 100 characters (maximum)
        scheduledAt: new Date(),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with notes as undefined', () => {
      const validData = {
        name: 'Treino B',
        scheduledAt: new Date(),
        notes: undefined,
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('name validation', () => {
    it('should fail when name is missing', () => {
      const invalidData = {
        scheduledAt: new Date(),
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should fail when name is empty string', () => {
      const invalidData = {
        name: '',
        scheduledAt: new Date(),
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('3 caracteres');
      }
    });

    it('should fail when name is too short (2 characters)', () => {
      const invalidData = {
        name: 'AB',
        scheduledAt: new Date(),
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nome deve ter no mínimo 3 caracteres');
      }
    });

    it('should fail when name is too long (101 characters)', () => {
      const invalidData = {
        name: 'A'.repeat(101),
        scheduledAt: new Date(),
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nome deve ter no máximo 100 caracteres');
      }
    });

    it('should fail when name is not a string', () => {
      const invalidData = {
        name: 123,
        scheduledAt: new Date(),
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail when name is null', () => {
      const invalidData = {
        name: null,
        scheduledAt: new Date(),
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('scheduledAt validation', () => {
    it('should accept valid Date object', () => {
      const validData = {
        name: 'Treino',
        scheduledAt: new Date('2024-01-15'),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept current date', () => {
      const validData = {
        name: 'Treino',
        scheduledAt: new Date(),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept past date', () => {
      const validData = {
        name: 'Treino',
        scheduledAt: new Date('2020-01-01'),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept future date', () => {
      const validData = {
        name: 'Treino',
        scheduledAt: new Date('2025-12-31'),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when scheduledAt is missing', () => {
      const invalidData = {
        name: 'Treino',
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data do treino é obrigatória');
      }
    });

    it('should fail when scheduledAt is null', () => {
      const invalidData = {
        name: 'Treino',
        scheduledAt: null,
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod treats null as invalid type rather than missing
        expect(result.error.issues[0].message).toBe('Data inválida');
      }
    });

    it('should fail when scheduledAt is undefined', () => {
      const invalidData = {
        name: 'Treino',
        scheduledAt: undefined,
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data do treino é obrigatória');
      }
    });

    it('should fail when scheduledAt is string', () => {
      const invalidData = {
        name: 'Treino',
        scheduledAt: '2024-01-15',
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data inválida');
      }
    });

    it('should fail when scheduledAt is number', () => {
      const invalidData = {
        name: 'Treino',
        scheduledAt: 1234567890,
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data inválida');
      }
    });

    it('should fail when scheduledAt is invalid Date', () => {
      const invalidData = {
        name: 'Treino',
        scheduledAt: new Date('invalid-date'),
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('notes validation', () => {
    it('should accept notes as string', () => {
      const validData = {
        name: 'Treino',
        scheduledAt: new Date(),
        notes: 'Treino focado em força',
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept missing notes field', () => {
      const validData = {
        name: 'Treino',
        scheduledAt: new Date(),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty string for notes', () => {
      const validData = {
        name: 'Treino',
        scheduledAt: new Date(),
        notes: '',
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept very long notes', () => {
      const validData = {
        name: 'Treino',
        scheduledAt: new Date(),
        notes: 'A'.repeat(1000),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when notes is not a string', () => {
      const invalidData = {
        name: 'Treino',
        scheduledAt: new Date(),
        notes: 123,
      };

      const result = sessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const result = sessionSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should handle extra fields (should be ignored)', () => {
      const dataWithExtra = {
        name: 'Treino A',
        scheduledAt: new Date(),
        extraField: 'should be ignored',
        anotherExtra: 123,
      };

      const result = sessionSchema.safeParse(dataWithExtra);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in name', () => {
      const validData = {
        name: 'Treino A-1 (Hipertrofia)',
        scheduledAt: new Date(),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle unicode characters in name', () => {
      const validData = {
        name: 'Treino Específico',
        scheduledAt: new Date(),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle date with time components', () => {
      const validData = {
        name: 'Treino',
        scheduledAt: new Date('2024-01-15T14:30:45.123Z'),
      };

      const result = sessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scheduledAt.getHours()).toBeDefined();
      }
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript types', () => {
      const validData = {
        name: 'Test Session',
        scheduledAt: new Date(),
        notes: 'Test notes',
      };

      const result = sessionSchema.safeParse(validData);
      
      if (result.success) {
        // Type checks (compile-time)
        const name: string = result.data.name;
        const scheduledAt: Date = result.data.scheduledAt;
        const notes: string | undefined = result.data.notes;
        
        expect(name).toBeDefined();
        expect(scheduledAt).toBeInstanceOf(Date);
        expect(typeof notes).toBe('string');
      }
    });
  });
});

