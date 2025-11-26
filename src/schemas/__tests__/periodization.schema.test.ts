/**
 * Tests for Periodization Schema validation
 */

import { periodizationSchema } from '../periodization.schema';

describe('periodizationSchema', () => {
  describe('valid data', () => {
    it('should validate with all required fields', () => {
      const validData = {
        name: 'Hipertrofia 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with all fields including description', () => {
      const validData = {
        name: 'Programa de Força',
        description: 'Periodização focada em ganho de força máxima',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Programa de Força');
        expect(result.data.description).toBe('Periodização focada em ganho de força máxima');
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.endDate).toBeInstanceOf(Date);
      }
    });

    it('should validate with minimum name length', () => {
      const validData = {
        name: 'ABC', // 3 characters (minimum)
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with maximum name length', () => {
      const validData = {
        name: 'A'.repeat(100), // 100 characters (maximum)
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate when endDate is one day after startDate', () => {
      const validData = {
        name: 'Short Program',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with description as undefined', () => {
      const validData = {
        name: 'Program',
        description: undefined,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('name validation', () => {
    it('should fail when name is missing', () => {
      const invalidData = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should fail when name is empty string', () => {
      const invalidData = {
        name: '',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('3 caracteres');
      }
    });

    it('should fail when name is too short (2 characters)', () => {
      const invalidData = {
        name: 'AB',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nome deve ter no mínimo 3 caracteres');
      }
    });

    it('should fail when name is too long (101 characters)', () => {
      const invalidData = {
        name: 'A'.repeat(101),
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nome deve ter no máximo 100 caracteres');
      }
    });

    it('should fail when name is not a string', () => {
      const invalidData = {
        name: 123,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail when name is null', () => {
      const invalidData = {
        name: null,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('startDate validation', () => {
    it('should accept valid Date object', () => {
      const validData = {
        name: 'Program',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept past startDate', () => {
      const validData = {
        name: 'Program',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept future startDate', () => {
      const validData = {
        name: 'Program',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when startDate is missing', () => {
      const invalidData = {
        name: 'Program',
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data de início é obrigatória');
      }
    });

    it('should fail when startDate is null', () => {
      const invalidData = {
        name: 'Program',
        startDate: null,
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod treats null as invalid type rather than missing
        expect(result.error.issues[0].message).toBe('Data inválida');
      }
    });

    it('should fail when startDate is string', () => {
      const invalidData = {
        name: 'Program',
        startDate: '2024-01-01',
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data inválida');
      }
    });

    it('should fail when startDate is invalid Date', () => {
      const invalidData = {
        name: 'Program',
        startDate: new Date('invalid'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('endDate validation', () => {
    it('should accept valid Date object', () => {
      const validData = {
        name: 'Program',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when endDate is missing', () => {
      const invalidData = {
        name: 'Program',
        startDate: new Date('2024-01-01'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data de fim é obrigatória');
      }
    });

    it('should fail when endDate is null', () => {
      const invalidData = {
        name: 'Program',
        startDate: new Date('2024-01-01'),
        endDate: null,
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod treats null as invalid type rather than missing
        expect(result.error.issues[0].message).toBe('Data inválida');
      }
    });

    it('should fail when endDate is string', () => {
      const invalidData = {
        name: 'Program',
        startDate: new Date('2024-01-01'),
        endDate: '2024-12-31',
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data inválida');
      }
    });

    it('should fail when endDate is invalid Date', () => {
      const invalidData = {
        name: 'Program',
        startDate: new Date('2024-01-01'),
        endDate: new Date('invalid'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('business rule: endDate > startDate', () => {
    it('should fail when endDate equals startDate', () => {
      const invalidData = {
        name: 'Program',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2024-01-01T00:00:00.000Z'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data de fim deve ser posterior à data de início');
        expect(result.error.issues[0].path).toContain('endDate');
      }
    });

    it('should fail when endDate is before startDate', () => {
      const invalidData = {
        name: 'Program',
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data de fim deve ser posterior à data de início');
        expect(result.error.issues[0].path).toContain('endDate');
      }
    });

    it('should fail when endDate is one second before startDate', () => {
      const invalidData = {
        name: 'Program',
        startDate: new Date('2024-01-01T12:00:00.000Z'),
        endDate: new Date('2024-01-01T11:59:59.999Z'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should pass when endDate is one second after startDate', () => {
      const validData = {
        name: 'Program',
        startDate: new Date('2024-01-01T12:00:00.000Z'),
        endDate: new Date('2024-01-01T12:00:00.001Z'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('description validation', () => {
    it('should accept string description', () => {
      const validData = {
        name: 'Program',
        description: 'This is a detailed description',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept missing description field', () => {
      const validData = {
        name: 'Program',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty string description', () => {
      const validData = {
        name: 'Program',
        description: '',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept very long description', () => {
      const validData = {
        name: 'Program',
        description: 'A'.repeat(1000),
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when description is not a string', () => {
      const invalidData = {
        name: 'Program',
        description: 123,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const result = periodizationSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should handle extra fields (should be ignored)', () => {
      const dataWithExtra = {
        name: 'Program',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        extraField: 'ignored',
      };

      const result = periodizationSchema.safeParse(dataWithExtra);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in name', () => {
      const validData = {
        name: 'Programa 2024-A (Hipertrofia)',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle unicode characters in name', () => {
      const validData = {
        name: 'Periodização Específica',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle dates with time components', () => {
      const validData = {
        name: 'Program',
        startDate: new Date('2024-01-01T08:00:00.000Z'),
        endDate: new Date('2024-12-31T18:30:00.000Z'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle very long time periods', () => {
      const validData = {
        name: 'Long Program',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2030-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle short time periods', () => {
      const validData = {
        name: 'Short Program',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2024-01-01T00:00:01.000Z'), // 1 second apart
      };

      const result = periodizationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript types', () => {
      const validData = {
        name: 'Test Program',
        description: 'Test description',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = periodizationSchema.safeParse(validData);
      
      if (result.success) {
        // Type checks (compile-time)
        const name: string = result.data.name;
        const description: string | undefined = result.data.description;
        const startDate: Date = result.data.startDate;
        const endDate: Date = result.data.endDate;
        
        expect(name).toBeDefined();
        expect(startDate).toBeInstanceOf(Date);
        expect(endDate).toBeInstanceOf(Date);
        expect(typeof description).toBe('string');
      }
    });
  });
});

